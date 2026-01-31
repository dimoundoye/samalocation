const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/authMiddleware');

// All maintenance routes require authentication
router.use(authMiddleware);

// Tenant routes
router.post('/', maintenanceController.create);
router.get('/tenant', maintenanceController.getTenantRequests);

// Owner routes
router.get('/owner', maintenanceController.getOwnerRequests);
router.patch('/:id/status', maintenanceController.updateStatus);

module.exports = router;
