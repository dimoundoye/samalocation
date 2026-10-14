const db = require('../config/db');

/**
 * Trace une action sensible d'un administrateur. N'interrompt jamais l'action en cas d'échec d'écriture.
 * (Le nom de l'admin est recopié : la trace reste lisible même si son compte est supprimé.)
 */
async function logAdminAction(req, { action, targetType = null, targetId = null, targetLabel = null, details = null }) {
    try {
        await db.query(
            `INSERT INTO admin_audit_logs (admin_id, admin_name, action, target_type, target_id, target_label, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [req.user.id, req.user.full_name || req.user.email || null, action, targetType,
             targetId ? String(targetId) : null, targetLabel, details ? JSON.stringify(details) : null]
        );
    } catch (err) {
        console.error(`[ADMIN AUDIT] ❌ Action "${action}" non journalisée :`, err.message);
    }
}

async function listAdminActions(limit = 100) {
    const { rows } = await db.query(
        `SELECT id, admin_id, admin_name, action, target_type, target_id, target_label, details, created_at
         FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1`,
        [Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500)]
    );
    return rows;
}

module.exports = { logAdminAction, listAdminActions };
