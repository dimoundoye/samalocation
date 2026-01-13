const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Toutes les routes nécessitent une authentification + rôle admin
router.use(authenticate);
router.use(adminMiddleware);

// Routes admin seulement
router.get('/', userController.getAllUsers);
router.patch('/:id/block', userController.blockUser);
router.patch('/:id/unblock', userController.unblockUser);

module.exports = router;
