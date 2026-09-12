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
            'INSERT INTO contact_messages (id, name, email, subject, message) VALUES ($1, $2, $3, $4, $5)',
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
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
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

        await db.query('UPDATE contact_messages SET status = $1 WHERE id = $2', [status, req.params.id]);

        return response.success(res, null, 'Statut mis à jour.');
    } catch (error) {
        console.error('Error updating contact status:', error);
        return response.error(res, error.message, 500);
    }
});

// POST /api/contact/:id/reply - Admin route to send an email reply to contact message
router.post('/:id/reply', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { replyMessage, replySubject } = req.body;

        if (!replyMessage || replyMessage.trim().length === 0) {
            return response.error(res, 'Le message de réponse ne peut pas être vide.', 400);
        }

        const { rows } = await db.query('SELECT * FROM contact_messages WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return response.error(res, 'Message non trouvé.', 404);
        }

        const contactMsg = rows[0];
        const emailTemplates = require('../utils/emailTemplates');
        const { sendEmail } = require('../utils/emailService');

        const emailData = emailTemplates.getSupportReplyTemplate({
            userName: contactMsg.name,
            originalSubject: contactMsg.subject,
            originalMessage: contactMsg.message,
            replyContent: replyMessage.trim()
        });

        const subjectToSend = replySubject || emailData.subject;
        const sent = await sendEmail(contactMsg.email, subjectToSend, emailData.html);

        if (!sent) {
            return response.error(res, 'Échec de l\'envoi de l\'e-mail.', 500);
        }

        // Met à jour automatiquement le statut en "replied"
        await db.query('UPDATE contact_messages SET status = $1 WHERE id = $2', ['replied', req.params.id]);

        return response.success(res, null, 'Réponse envoyée avec succès par e-mail.');
    } catch (error) {
        console.error('Error replying to contact message:', error);
        return response.error(res, error.message, 500);
    }
});

module.exports = router;

