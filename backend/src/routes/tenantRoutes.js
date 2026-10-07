const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');

// Get current tenant lease info
router.get('/me', authMiddleware, tenantController.getMyLease);

// Get ALL leases (including inactive/historical) for the current tenant
router.get('/me/all', authMiddleware, tenantController.getMyAllLeases);

// Update current tenant's profile
router.patch('/me/profile', authMiddleware, tenantController.updateMyProfile);

// Get owner's tenants
router.get('/owner', authMiddleware, can('tenant.read'), tenantController.getOwnerTenants);

// Assign tenant to unit
const { checkTenantLimit } = require('../middleware/subscriptionMiddleware');
router.post('/', authMiddleware, can('tenant.write'), checkTenantLimit, tenantController.assignTenant);

// Update tenant
router.put('/:id', authMiddleware, can('tenant.write'), tenantController.updateTenant);

// Delete tenant
router.delete('/:id', authMiddleware, can('tenant.write'), tenantController.deleteTenant);

module.exports = router;
