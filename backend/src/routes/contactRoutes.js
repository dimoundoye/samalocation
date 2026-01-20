const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const response = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// POST /api/contact - Public route to send a message
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return response.error(res, 'Veuillez remplir tous les champs.', 400);
        }

        const id = uuidv4();
        await db.query(
            'INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, subject, message]
        );

        console.log(`[Contact] Nouveau message reçu de ${name} (${email}) et sauvegardé en BDD.`);

        return response.success(res, null, 'Message reçu avec succès.');
    } catch (error) {
        console.error('Error saving contact message:', error);
        return response.error(res, error.message, 500);
    }
});

// GET /api/contact - Admin route to list messages
// REMOVED explicit / to test if it fixes the 404
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        return response.success(res, rows);
    } catch (error) {
        console.error('Error getting contact messages:', error);
        return response.error(res, error.message, 500);
    }
});

// PATCH /api/contact/:id/status - Admin route to update status
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['new', 'replied', 'archived'].includes(status)) {
            return response.error(res, 'Statut invalide', 400);
        }

        await db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, req.params.id]);

        return response.success(res, null, 'Statut mis à jour.');
    } catch (error) {
        console.error('Error updating contact status:', error);
        return response.error(res, error.message, 500);
    }
});

module.exports = router;
