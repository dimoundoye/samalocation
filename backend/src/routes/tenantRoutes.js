const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const authMiddleware = require('../middleware/authMiddleware');

// Get current tenant lease info
router.get('/me', authMiddleware, tenantController.getMyLease);

// Update current tenant's profile
router.patch('/me/profile', authMiddleware, tenantController.updateMyProfile);

// Get owner's tenants
router.get('/owner', authMiddleware, tenantController.getOwnerTenants);

// Assign tenant to unit
router.post('/', authMiddleware, tenantController.assignTenant);

// Update tenant
router.put('/:id', authMiddleware, tenantController.updateTenant);

// Delete tenant
router.delete('/:id', authMiddleware, tenantController.deleteTenant);

module.exports = router;
