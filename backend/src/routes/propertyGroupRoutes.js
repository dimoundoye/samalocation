const express = require('express');
const router = express.Router();
const propertyGroupController = require('../controllers/propertyGroupController');
const authMiddleware = require('../middleware/authMiddleware');

// Secure all property group routes with authentication
router.use(authMiddleware);

// Get all property groups
router.get('/', propertyGroupController.getGroups);

// Bulk synchronize property groups
router.put('/sync', propertyGroupController.syncGroups);

module.exports = router;
