const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');

// Créer un reçu (propriétaire seulement)
const { checkReceiptLimit } = require('../middleware/subscriptionMiddleware');
router.post('/', authMiddleware, can('receipt.write'), checkReceiptLimit, receiptController.createReceipt);

// Récupérer les reçus d'un locataire
router.get('/tenant', authMiddleware, receiptController.getTenantReceipts);

// Récupérer les reçus créés par un propriétaire
router.get('/owner', authMiddleware, can('receipt.read'), receiptController.getOwnerReceipts);

// Télécharger un reçu en PDF
router.get('/:id/download', authMiddleware, receiptController.downloadReceipt);

// Annuler un reçu avec motif (propriétaire/agence)
router.patch('/:id/cancel', authMiddleware, can('receipt.write'), receiptController.cancelReceipt);

// Supprimer un reçu (propriétaire seulement)
router.delete('/:id', authMiddleware, can('receipt.write'), receiptController.deleteReceipt);

module.exports = router;
