const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const activityLogController = require('../controllers/activityLogController');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');
const { checkFeatureAccess } = require('../middleware/subscriptionMiddleware');

// Get public owner profile (public)
router.get('/:id/public-profile', ownerController.getPublicProfile);

// Get owner profile
router.get('/profile', authMiddleware, ownerController.getProfile);

// Update/Upsert owner profile
router.patch('/profile', authMiddleware, ownerController.updateProfile);

// Gestion des collaborateurs (Multi-utilisateurs - Plan Professionnel)
router.get('/collaborators', authMiddleware, can('team.manage'), ownerController.getCollaborators);
router.post('/collaborators', authMiddleware, can('team.manage'), checkFeatureAccess('multi_user'), ownerController.addCollaborator);
router.patch('/collaborators/:id/permissions', authMiddleware, can('team.manage'), checkFeatureAccess('multi_user'), ownerController.updateCollaboratorPermissions);
router.delete('/collaborators/:id', authMiddleware, can('team.manage'), ownerController.removeCollaborator);

// Invitations d'équipe
router.get('/invitations/:token', ownerController.getInvitationDetails);
router.post('/invitations/:token/accept', authMiddleware, ownerController.acceptInvitation);

// Journal d'activité (réservé au patron - plan Professionnel)
router.get('/activity-log', authMiddleware, can('activity.read'), checkFeatureAccess('multi_user'), activityLogController.getActivityLog);
// Export Excel de la gérance : plan Professionnel et titulaire du compte uniquement
router.post('/exports/gerance', authMiddleware, checkFeatureAccess('excel_reports'), activityLogController.authorizeGeranceExport);
// Route pour logger des actions frontend (groupes)
router.post('/activity-log', authMiddleware, activityLogController.createActivityLog);

module.exports = router;
