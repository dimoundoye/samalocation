const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// Get all messages for current user
router.get('/', authMiddleware, messageController.getUserMessages);

// Send a message (candidature)
router.post('/', authMiddleware, messageController.sendMessage);

// Mark messages as read
router.patch('/read', authMiddleware, messageController.markAsRead);

// Delete a message
router.delete('/:id', authMiddleware, messageController.deleteMessage);

module.exports = router;
