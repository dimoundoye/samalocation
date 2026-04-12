const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.addFavorite);
router.get('/:propertyId/check', favoriteController.checkFavorite);
router.delete('/:propertyId', favoriteController.removeFavorite);

module.exports = router;
