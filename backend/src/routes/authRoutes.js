const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const response = require('../utils/response');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');
const {
    signupValidation,
    loginValidation,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation
} = require('../middleware/validationMiddleware');

// Signup
router.post('/signup', signupValidation, authController.signup);

// Verify email
router.get('/verify-email', authController.verifyEmail);

// Resend verification
router.post('/resend-verification', authController.resendVerification);

// Login
router.post('/login', loginValidation, authController.login);



// Get Me
router.get('/me', authController.getMe);

// Search users by name or email
// Recherche d'un locataire par identifiant exact, réservée aux comptes qui peuvent affecter un locataire.
// 20 recherches par minute et par compte : empêche d'essayer des identifiants au hasard.
const tenantSearchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    validate: false,
    keyGenerator: (req) => `tenant-search:${req.user?.id || rateLimit.ipKeyGenerator(req.ip)}`,
    handler: (req, res) => response.error(res, 'Trop de recherches. Patientez une minute avant de réessayer.', 429),
});
router.get('/users/search', authMiddleware, can('tenant.write'), tenantSearchLimiter, authController.searchUsers);

// Change password
router.post('/change-password', authMiddleware, authController.changePassword);

// Update my personal profile (name, phone)
router.patch('/update-profile', authMiddleware, authController.updateMyProfile);

// Create tenant account (for owners)
router.post('/create-tenant-account', authMiddleware, can('tenant.write'), authController.createTenantAccount);

// Complete setup (for newly created tenants)
router.post('/complete-setup', authMiddleware, authController.completeSetup);

// Forgot password
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

// Reset password
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;
