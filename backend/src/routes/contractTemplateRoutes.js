const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');
const { checkFeatureAccess } = require('../middleware/subscriptionMiddleware');
const controller = require('../controllers/contractTemplateController');

// All routes require authentication + professional plan (custom_contract feature)
router.use(authMiddleware);
router.use(can('contract.write'));
router.use(checkFeatureAccess('custom_contract'));

// GET  /api/contract-templates — Liste des modèles
router.get('/', controller.list);

// POST /api/contract-templates — Créer un modèle
router.post('/', controller.create);

// POST /api/contract-templates/extract — Extraire texte d'un PDF/DOCX
router.post('/extract', controller.uploadMiddleware, controller.extractDocument);

// PUT  /api/contract-templates/:id — Modifier un modèle
router.put('/:id', controller.update);

// DELETE /api/contract-templates/:id — Supprimer un modèle
router.delete('/:id', controller.delete);

module.exports = router;
