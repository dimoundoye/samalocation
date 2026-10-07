const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authMiddleware = require('../middleware/authMiddleware');
const { can } = require('../middleware/permissionMiddleware');

router.get('/:id/verify', contractController.verifyContract);

router.use(authMiddleware);

router.post('/', can('contract.write'), contractController.createContract);
router.get('/owner', can('contract.read'), contractController.getOwnerContracts);
router.get('/tenant', contractController.getTenantContracts);
router.get('/:id', contractController.getContractDetails);
router.post('/:id/sign', contractController.signContract);
router.get('/:id/download', contractController.downloadContract);

module.exports = router;
