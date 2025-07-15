require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const urlRoutes = require('./routes/urlRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const loggingMiddleware = require('./middleware/logging');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('../logging/logger');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB().catch(err => {
    logger.error('Failed to connect to database', { error: err.message });
    logger.warn('Continuing with in-memory storage fallback');
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.set('trust proxy', true);

app.use(loggingMiddleware);

app.use('/api', urlRoutes); 
app.use('/', redirectRoutes); 

app.use(notFoundHandler);
app.use(errorHandler);

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

app.listen(PORT, () => {
    logger.info('URL Shortener service started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
    console.log(`URL Shortener service running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
    console.log(`Short URLs will redirect from http://localhost:${PORT}/{shortcode}\n`);
});

module.exports = app;