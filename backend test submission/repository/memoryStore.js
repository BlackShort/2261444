const logger = require('../../logging/logger');

class InMemoryStore {
    constructor() {
        this.urls = new Map();
        this.clicks = new Map();
        logger.info('In Memory Storage');
    }

    async save(urlData) {
        const id = Date.now().toString();
        const url = {
            _id: id,
            ...urlData,
            clicks: [],
            clickCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.urls.set(urlData.shortcode, url);
        logger.info('URL saved to memory store', { shortcode: urlData.shortcode });
        return url;
    }

    async findOne(query) {
        if (query.shortcode) {
            const url = this.urls.get(query.shortcode);
            return url || null;
        }
        return null;
    }

    async addClick(shortcode, clickData) {
        const url = this.urls.get(shortcode);
        if (url) {
            const click = {
                ...clickData,
                timestamp: new Date()
            };
            url.clicks.push(click);
            url.clickCount = url.clicks.length;
            url.updatedAt = new Date();
            
            logger.info('Click added to memory store', { shortcode, totalClicks: url.clickCount });
            return url;
        }
        return null;
    }

    async deleteExpired() {
        const now = new Date();
        let deletedCount = 0;
        
        for (const [shortcode, url] of this.urls.entries()) {
            if (url.expiresAt < now) {
                this.urls.delete(shortcode);
                deletedCount++;
            }
        }
        
        if (deletedCount > 0) {
            logger.info('Expired URLs Deleted from memory store', { deletedCount });
        }
        
        return deletedCount;
    }
}

module.exports = InMemoryStore;
