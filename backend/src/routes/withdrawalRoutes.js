const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRentOnlinePayment } = require('../config/features');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Portefeuille et retraits désactivés tant que le paiement de loyer en ligne l'est
router.use(requireRentOnlinePayment);

// Récupérer les données du portefeuille (solde, historique transactions & retraits)
router.get('/wallet', withdrawalController.getMyWalletData);

// Demander un retrait (Wave/OM/Bank) sécurisé par mot de passe
router.post('/request', withdrawalController.requestWithdrawal);

// Activer/Désactiver le paiement de loyer en ligne pour ses locataires
router.post('/toggle-payment', withdrawalController.toggleOnlinePayment);

module.exports = router;
