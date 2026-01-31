/**
 * Standardized API response helper
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data,
        v: '3.2'
    });
};

const error = (res, message = 'Error', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
        status: 'error',
        message,
        errors,
        v: '3.2'
    });
};

module.exports = {
    success,
    error
};
