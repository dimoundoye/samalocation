const express = require('express');
const router = express.Router();
const propertyGroupController = require('../controllers/propertyGroupController');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');

// Secure all property group routes with authentication
router.use(authMiddleware);

// Get all property groups
router.get('/', can('property.read'), propertyGroupController.getGroups);

// Bulk synchronize property groups
router.put('/sync', can('property.write'), propertyGroupController.syncGroups);

module.exports = router;
