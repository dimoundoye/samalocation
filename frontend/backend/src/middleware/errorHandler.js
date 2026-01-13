const response = require('../utils/response');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.stack || err.message}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    return response.error(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = errorHandler;
