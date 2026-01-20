const { validationResult, body } = require('express-validator');
const response = require('../utils/response');

/**
 * Middleware pour valider les résultats de express-validator
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return response.error(res, 'Validation failed', 400, errors.array());
    }
    next();
};

/**
 * Validations pour l'inscription
 */
const signupValidation = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('name').notEmpty().withMessage('Le nom est requis').trim().escape(),
    body('phone').optional().trim().escape(),
    validate
];

/**
 * Validations pour la connexion
 */
const loginValidation = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').notEmpty().withMessage('Le mot de passe est requis'),
    validate
];

/**
 * Validations pour le changement de mot de passe
 */
const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Ancien mot de passe requis'),
    body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
    validate
];

module.exports = {
    signupValidation,
    loginValidation,
    changePasswordValidation
};
