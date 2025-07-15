const logger = require('../../logging/logger');

const loggingMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const { method, url, headers, body, query, params } = req;
    
    logger.info('Incoming request', {
        method,
        url,
        headers: {
            'user-agent': headers['user-agent'],
            'content-type': headers['content-type'],
            'referer': headers['referer']
        },
        body: method === 'POST' || method === 'PUT' ? body : undefined,
        query,
        params,
        ip: req.ip || req.connection.remoteAddress
    });

    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        
        logger.info('Response sent', {
            method,
            url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: JSON.stringify(data).length
        });
        
        return originalJson.call(this, data);
    };

    const originalRedirect = res.redirect;
    res.redirect = function(statusCode, location) {
        const duration = Date.now() - startTime;
        
        if (typeof statusCode === 'string') {
            location = statusCode;
            statusCode = 302;
        }
        
        logger.info('Redirect sent', {
            method,
            url,
            redirectTo: location,
            statusCode,
            duration: `${duration}ms`
        });
        
        return originalRedirect.call(this, statusCode, location);
    };

    res.on('error', (error) => {
        logger.error('Response error', {
            method,
            url,
            error: error.message,
            stack: error.stack
        });
    });

    next();
};

module.exports = loggingMiddleware;
