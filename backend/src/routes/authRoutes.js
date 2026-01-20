const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { signupValidation, loginValidation, changePasswordValidation } = require('../middleware/validationMiddleware');

// Signup
router.post('/signup', signupValidation, authController.signup);

// Login
router.post('/login', loginValidation, authController.login);

// Get Me
router.get('/me', authController.getMe);

// Search users by name or email
router.get('/users/search', authMiddleware, authController.searchUsers);

// Change password
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
