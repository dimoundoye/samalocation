const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const authMiddleware = require('../middleware/authMiddleware');

// Get owner profile
router.get('/profile', authMiddleware, ownerController.getProfile);

// Update/Upsert owner profile
router.patch('/profile', authMiddleware, ownerController.updateProfile);

module.exports = router;
