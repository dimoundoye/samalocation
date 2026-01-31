const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const propertyController = require('../controllers/propertyController');

// Get all published properties (public)
router.get('/', propertyController.getAllPublished);

// Route temporaire pour migrer la base de données
router.get('/migrate-database-coords', propertyController.runMigration);

// Get owner properties (protected)
router.get('/owner', authMiddleware, propertyController.getOwnerProperties);

// Get single property details (public)
router.get('/:id', propertyController.getPropertyById);

// Get similar properties (public)
router.get('/:id/similar', propertyController.getSimilarProperties);

// Create property (protected)
router.post('/', authMiddleware, propertyController.createProperty);

// Toggle publication status (protected)
router.patch('/:id/publish', authMiddleware, propertyController.togglePublication);

// Add units to property (protected)
router.post('/units', authMiddleware, propertyController.addUnits);

// Update property (protected)
router.put('/:id', authMiddleware, propertyController.updateProperty);

// Delete property (protected)
router.delete('/:id', authMiddleware, propertyController.deleteProperty);

module.exports = router;
