const mongoose = require('mongoose');
const Url = require('../repository/urlModel');
const InMemoryStore = require('../repository/memoryStore');
const { 
    generateShortcode, 
    calculateExpiryDate, 
    isValidUrl, 
    isValidShortcode,
    sanitizeShortcode 
} = require('../utils/helpers');
const { getGeolocation, extractReferrer, getClientIP } = require('../utils/geoUtils');
const logger = require('../../logging/logger');

class UrlService {
    constructor() {
        this.memoryStore = null;
        this.useMemoryStore = false;
    }

    initMemoryStore() {
        if (!this.memoryStore) {
            this.memoryStore = new InMemoryStore();
            this.useMemoryStore = true;
            logger.warn('Initialized in-memory store as MongoDB fallback', { 
                package: 'repository', 
                stack: 'backend' 
            });
        }
    }

    shouldUseMemoryStore() {
        return this.useMemoryStore || mongoose.connection.readyState !== 1;
    }

    async createShortUrl(urlData) {
        const { url: originalUrl, validity = 30, shortcode: customShortcode } = urlData;

        if (!isValidUrl(originalUrl)) {
            logger.warn('Invalid URL provided', { 
                originalUrl, 
                package: 'service', 
                stack: 'backend' 
            });
            throw new Error('Invalid URL format');
        }

        if (validity < 1 || validity > 525600) {
            logger.warn('Invalid validity period', { 
                validity, 
                package: 'service', 
                stack: 'backend' 
            });
            throw new Error('Validity must be between 1 and 525600 minutes');
        }

        let shortcode;

        if (customShortcode) {
            const sanitized = sanitizeShortcode(customShortcode);
            if (!isValidShortcode(sanitized)) {
                logger.warn('Invalid custom shortcode format', { customShortcode, sanitized });
                throw new Error('Shortcode must be alphanumeric and between 1-20 characters');
            }

            const existingUrl = await this.findUrl({ shortcode: sanitized });
            if (existingUrl) {
                logger.warn('Shortcode already exists', { shortcode: sanitized });
                throw new Error('Shortcode already exists. Please choose a different one.');
            }

            shortcode = sanitized;
        } else {
            shortcode = await this.generateUniqueShortcode();
        }

        const expiresAt = calculateExpiryDate(validity);

        const urlObj = {
            originalUrl,
            shortcode,
            expiresAt,
            validityMinutes: validity
        };

        let savedUrl;
        
        if (this.shouldUseMemoryStore()) {
            this.initMemoryStore();
            savedUrl = await this.memoryStore.save(urlObj);
        } else {
            const newUrl = new Url(urlObj);
            savedUrl = await newUrl.save();
        }
        
        logger.info('Short URL created successfully', {
            shortcode,
            originalUrl,
            expiresAt,
            validity,
            package: 'service',
            stack: 'backend'
        });

        return savedUrl;
    }

    async generateUniqueShortcode(attempts = 0) {
        if (attempts > 10) {
            throw new Error('Unable to generate unique shortcode');
        }

        const shortcode = generateShortcode(6 + attempts);
        const existingUrl = await this.findUrl({ shortcode });

        if (existingUrl) {
            return this.generateUniqueShortcode(attempts + 1);
        }

        return shortcode;
    }

    async findUrl(query) {
        if (this.shouldUseMemoryStore()) {
            this.initMemoryStore();
            return await this.memoryStore.findOne(query);
        } else {
            return await Url.findOne(query);
        }
    }

  
    async getOriginalUrl(shortcode, clickData = {}) {
        const url = await this.findUrl({ shortcode });

        if (!url) {
            logger.warn('Shortcode not found', { shortcode });
            throw new Error('Short URL not found');
        }

        if (this.isUrlExpired(url)) {
            logger.warn('Shortcode expired', { shortcode, expiresAt: url.expiresAt });
            throw new Error('Short URL has expired');
        }

        await this.trackClick(url, clickData);

        logger.info('URL accessed successfully', { 
            shortcode, 
            originalUrl: url.originalUrl,
            clickCount: url.clickCount + 1
        });

        return url.originalUrl;
    }


    isUrlExpired(url) {
        return new Date() > new Date(url.expiresAt);
    }

    async trackClick(url, clickData) {
        const { ip, referrer, userAgent } = clickData;

        const clickInfo = {
            sourceIP: ip || '127.0.0.1',
            referrer: extractReferrer(referrer),
            userAgent: userAgent || 'Unknown',
            geolocation: getGeolocation(ip)
        };

        if (this.shouldUseMemoryStore()) {
            this.initMemoryStore();
            await this.memoryStore.addClick(url.shortcode, clickInfo);
        } else {
            await url.addClick(clickInfo);
        }

        logger.info('Click tracked', {
            shortcode: url.shortcode,
            clickInfo,
            totalClicks: url.clickCount + 1
        });
    }


    async getUrlStatistics(shortcode) {
        const url = await this.findUrl({ shortcode });

        if (!url) {
            logger.warn('Shortcode not found for statistics', { shortcode });
            throw new Error('Short URL not found');
        }

        const stats = {
            shortcode: url.shortcode,
            originalUrl: url.originalUrl,
            createdAt: url.createdAt,
            expiresAt: url.expiresAt,
            validityMinutes: url.validityMinutes,
            isExpired: this.isUrlExpired(url),
            totalClicks: url.clickCount,
            clicks: url.clicks.map(click => ({
                timestamp: click.timestamp,
                referrer: click.referrer,
                geolocation: {
                    country: click.geolocation.country,
                    region: click.geolocation.region,
                    city: click.geolocation.city
                }
            }))
        };

        logger.info('Statistics retrieved', { shortcode, totalClicks: stats.totalClicks });

        return stats;
    }

    async cleanupExpiredUrls() {
        let deletedCount = 0;
        
        if (this.shouldUseMemoryStore()) {
            this.initMemoryStore();
            deletedCount = await this.memoryStore.deleteExpired();
        } else {
            const result = await Url.deleteMany({ expiresAt: { $lt: new Date() } });
            deletedCount = result.deletedCount;
        }
        
        logger.info('Expired URLs cleaned up', { deletedCount });
        return deletedCount;
    }
}

module.exports = new UrlService();
