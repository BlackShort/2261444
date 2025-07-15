const urlService = require('../services/urlService');
const { getClientIP } = require('../utils/geoUtils');
const logger = require('../../logging/logger');

class UrlController {

    async createShortUrl(req, res) {
        try {
            const { url, validity, shortcode } = req.body;

            if (!url) {
                logger.warn('Missing URL in request', { body: req.body });
                return res.status(400).json({
                    error: 'URL is required',
                    message: 'Please provide a valid URL to shorten'
                });
            }

            const urlData = {
                url,
                validity: validity || 30,
                shortcode
            };

            const createdUrl = await urlService.createShortUrl(urlData);

            const response = {
                shortlink: `${req.protocol}://${req.get('host')}/${createdUrl.shortcode}`,
                expiry: createdUrl.expiresAt.toISOString()
            };

            logger.info('Short URL created via API', {
                originalUrl: url,
                shortcode: createdUrl.shortcode,
                expiry: response.expiry
            });

            res.status(201).json(response);

        } catch (error) {
            logger.error('Error creating short URL', {
                error: error.message,
                stack: error.stack,
                body: req.body
            });

            if (error.message.includes('Invalid URL') || 
                error.message.includes('Shortcode') ||
                error.message.includes('Validity')) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: error.message
                });
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An error occurred while creating the short URL'
            });
        }
    }


    async redirectToOriginalUrl(req, res) {
        try {
            const { shortcode } = req.params;

            if (!shortcode) {
                logger.warn('Missing shortcode in redirect request');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Shortcode is required'
                });
            }

            const clickData = {
                ip: getClientIP(req),
                referrer: req.get('Referer') || req.get('Referrer'),
                userAgent: req.get('User-Agent')
            };

            const originalUrl = await urlService.getOriginalUrl(shortcode, clickData);

            logger.info('Redirecting to original URL', {
                shortcode,
                originalUrl,
                clickData
            });

            res.redirect(301, originalUrl);

        } catch (error) {
            logger.error('Error in redirect', {
                error: error.message,
                shortcode: req.params.shortcode,
                ip: getClientIP(req)
            });

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Short URL not found'
                });
            }

            if (error.message.includes('expired')) {
                return res.status(410).json({
                    error: 'Gone',
                    message: 'Short URL has expired'
                });
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An error occurred while processing the redirect'
            });
        }
    }

    async getUrlStatistics(req, res) {
        try {
            const { shortcode } = req.params;

            if (!shortcode) {
                logger.warn('Missing shortcode in statistics request');
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Shortcode is required'
                });
            }

            const stats = await urlService.getUrlStatistics(shortcode);

            logger.info('Statistics retrieved via API', {
                shortcode,
                totalClicks: stats.totalClicks
            });

            res.status(200).json(stats);

        } catch (error) {
            logger.error('Error retrieving statistics', {
                error: error.message,
                shortcode: req.params.shortcode
            });

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Short URL not found'
                });
            }

            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An error occurred while retrieving statistics'
            });
        }
    }


    async healthCheck(req, res) {
        try {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        } catch (error) {
            logger.error('Health check failed', { error: error.message });
            res.status(500).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    }
}

module.exports = new UrlController();
