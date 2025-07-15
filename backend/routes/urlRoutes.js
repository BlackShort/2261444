const express = require('express');
const urlController = require('../controllers/urlController');

const router = express.Router();

// Create short URL
router.post('/shorturls', urlController.createShortUrl);

// Get URL statistics
router.get('/shorturls/:shortcode', urlController.getUrlStatistics);

// Health check
router.get('/health', urlController.healthCheck);

module.exports = router;
