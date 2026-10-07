const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');

// All maintenance routes require authentication
router.use(authMiddleware);

// Tenant routes
router.post('/', maintenanceController.create);
router.get('/tenant', maintenanceController.getTenantRequests);
router.put('/:id', maintenanceController.updateRequest);
router.delete('/:id', maintenanceController.deleteRequest);

// Owner routes
router.get('/owner', can('maintenance.read'), maintenanceController.getOwnerRequests);
router.patch('/:id/status', can('maintenance.write'), maintenanceController.updateStatus);

module.exports = router;
