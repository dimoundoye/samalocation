const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
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
router.get('/users/search', authMiddleware, authController.searchUsers);

// Change password
router.post('/change-password', authMiddleware, authController.changePassword);

// Create tenant account (for owners)
router.post('/create-tenant-account', authMiddleware, authController.createTenantAccount);

// Complete setup (for newly created tenants)
router.post('/complete-setup', authMiddleware, authController.completeSetup);

// Forgot password
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

// Reset password
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;
