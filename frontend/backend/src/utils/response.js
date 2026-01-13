/**
 * Standardized API response helper
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data
    });
};

const error = (res, message = 'Error', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
        errors
    });
};

module.exports = {
    success,
    error
};
