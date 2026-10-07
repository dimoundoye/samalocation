const { validationResult, body } = require('express-validator');
const response = require('../utils/response');
const { SIGNUP_ROLES, ACCOUNT_TYPES } = require('../config/roles');

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
    body('password').isLength({ min: 8, max: 72 }).withMessage('Le mot de passe doit contenir entre 8 et 72 caractères'),
    body('name').notEmpty().withMessage('Le nom est requis').trim().escape(),
    // Stocké au format international E.164 ("+221771234567"). Les anciennes versions de l'app
    // envoient un numéro libre : on accepte 7 à 15 chiffres, avec ou sans indicatif.
    body('phone').optional({ values: 'falsy' }).trim()
        .customSanitizer(v => String(v).replace(/[\s().-]/g, ''))
        .matches(/^\+?\d{7,15}$/).withMessage('Numéro de téléphone invalide'),
    body('role').isIn(SIGNUP_ROLES).withMessage('Rôle invalide'),
    body('accountType').optional({ values: 'null' }).isIn(Object.keys(ACCOUNT_TYPES)).withMessage('Type de compte invalide'),
    validate
];

/**
 * Validations pour la connexion
 */
const loginValidation = [
    body('email').notEmpty().withMessage('L\'identifiant est requis'),
    body('password').notEmpty().withMessage('Le mot de passe est requis'),
    validate
];

/**
 * Validations pour le changement de mot de passe
 */
const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Ancien mot de passe requis'),
    body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères'),
    validate
];

/**
 * Validations pour l'oubli de mot de passe
 */
const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    validate
];

/**
 * Validations pour la réinitialisation de mot de passe
 */
const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Token requis'),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
    validate
];

module.exports = {
    signupValidation,
    loginValidation,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation
};
