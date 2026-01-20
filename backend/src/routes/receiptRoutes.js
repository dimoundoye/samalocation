const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const authMiddleware = require('../middleware/authMiddleware');

// Créer un reçu (propriétaire seulement)
router.post('/', authMiddleware, receiptController.createReceipt);

// Récupérer les reçus d'un locataire
router.get('/tenant', authMiddleware, receiptController.getTenantReceipts);

// Récupérer les reçus créés par un propriétaire
router.get('/owner', authMiddleware, receiptController.getOwnerReceipts);

// Télécharger un reçu en PDF
router.get('/:id/download', authMiddleware, receiptController.downloadReceipt);

// Supprimer un reçu (propriétaire seulement)
router.delete('/:id', authMiddleware, receiptController.deleteReceipt);

module.exports = router;
