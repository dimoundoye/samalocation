const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkFeatureAccess } = require('../middleware/subscriptionMiddleware');

// Get owner profile
router.get('/profile', authMiddleware, ownerController.getProfile);

// Update/Upsert owner profile
router.patch('/profile', authMiddleware, ownerController.updateProfile);

// Gestion des collaborateurs (Multi-utilisateurs - Plan Professionnel)
router.get('/collaborators', authMiddleware, ownerController.getCollaborators);
router.post('/collaborators', authMiddleware, checkFeatureAccess('multi_user'), ownerController.addCollaborator);
router.patch('/collaborators/:id/permissions', authMiddleware, checkFeatureAccess('multi_user'), ownerController.updateCollaboratorPermissions);
router.delete('/collaborators/:id', authMiddleware, ownerController.removeCollaborator);

module.exports = router;
