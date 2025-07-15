const logger = require('../../logging/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    });

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            error: 'Validation Error',
            message: errors.join(', ')
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            error: 'Duplicate Entry',
            message: `${field} already exists`
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid Token',
            message: 'Authentication token is invalid'
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on the server'
    });
};

const notFoundHandler = (req, res) => {
    logger.warn('404 - Route not found', {
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
