const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

// Route for generating property descriptions
router.post('/generate-description', authMiddleware, aiController.generateDescription);

// Route for parsing natural language search queries
router.post('/parse-search', aiController.parseSearch);

// Route for AI Chatbot
router.post('/chat', aiController.chat);

module.exports = router;
