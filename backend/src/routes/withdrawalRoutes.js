const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const authMiddleware = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Récupérer les données du portefeuille (solde, historique transactions & retraits)
router.get('/wallet', withdrawalController.getMyWalletData);

// Demander un retrait (Wave/OM/Bank) sécurisé par mot de passe
router.post('/request', withdrawalController.requestWithdrawal);

// Activer/Désactiver le paiement de loyer en ligne pour ses locataires
router.post('/toggle-payment', withdrawalController.toggleOnlinePayment);

module.exports = router;
