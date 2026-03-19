const db = require('../config/db');

const PlatformSettings = {
    /**
     * Récupère tous les paramètres
     */
    async getAll() {
        const { rows } = await db.query('SELECT key, value FROM platform_settings');
        // Convertir le tableau en objet { [key]: value }
        return rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
    },

    /**
     * Récupère un paramètre spécifique
     */
    async get(key) {
        const { rows } = await db.query('SELECT value FROM platform_settings WHERE key = $1', [key]);
        return rows[0] ? rows[0].value : null;
    },

    /**
     * Met à jour un paramètre
     */
    async update(key, value) {
        const { rows } = await db.query(
            'INSERT INTO platform_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW() RETURNING *',
            [key, JSON.stringify(value)]
        );
        return rows[0];
    }
};

module.exports = PlatformSettings;
