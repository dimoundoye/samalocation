const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');
const propertyController = require('../controllers/propertyController');

// Get all published properties (public)
router.get('/', propertyController.getAllPublished);

// Get owner properties (protected)
router.get('/owner', authMiddleware, can('property.read'), propertyController.getOwnerProperties);

// Get single property details (public)
router.get('/:id', propertyController.getPropertyById);

// Get similar properties (public)
router.get('/:id/similar', propertyController.getSimilarProperties);

// Create property (protected)
const { checkPropertyLimit } = require('../middleware/subscriptionMiddleware');
router.post('/', authMiddleware, can('property.write'), checkPropertyLimit, propertyController.createProperty);

// Toggle publication status (protected)
router.patch('/:id/publish', authMiddleware, can('property.publish'), propertyController.togglePublication);

// Add units to property (protected)

// Update property (protected)
router.put('/:id', authMiddleware, can('property.write'), propertyController.updateProperty);

// Delete property (protected)
router.delete('/:id', authMiddleware, can('property.write'), propertyController.deleteProperty);

module.exports = router;
