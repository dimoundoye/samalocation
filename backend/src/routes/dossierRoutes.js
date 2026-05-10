const express = require('express');
const router = express.Router();
const dossierController = require('../controllers/dossierController');
const authenticateToken = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes Locataire
router.get('/me', dossierController.getMyDossier);
router.post('/save', dossierController.saveDossier);
router.post('/share', dossierController.shareDossier);
router.get('/shares', dossierController.getMyDossierShares);
router.delete('/shares/:ownerId', dossierController.revokeDossierShare);

// Routes Propriétaire
router.get('/shared', dossierController.getSharedDossiers);
router.get('/shared/:dossierId', dossierController.getSharedDossierDetails);
router.patch('/shared/:dossierId/status', dossierController.updateSharedDossierStatus);

module.exports = router;
