const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const propertyController = require('../controllers/propertyController');

// Get all published properties (public)
router.get('/', propertyController.getAllPublished);

// Get owner properties (protected)
router.get('/owner', authMiddleware, propertyController.getOwnerProperties);

// Get single property details (public)
router.get('/:id', propertyController.getPropertyById);

// Create property (protected)
router.post('/', authMiddleware, propertyController.createProperty);

// Toggle publication status (protected)
router.patch('/:id/publish', authMiddleware, propertyController.togglePublication);

// Add units to property (protected)
router.post('/units', authMiddleware, propertyController.addUnits);

// Delete property (protected)
router.delete('/:id', authMiddleware, propertyController.deleteProperty);

module.exports = router;
