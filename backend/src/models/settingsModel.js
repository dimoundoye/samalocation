const db = require('../config/db');

// Cache en mémoire pour éviter les requêtes DB répétitives (ex: mode maintenance)
const settingsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const PlatformSettings = {
    /**
     * Récupère tous les paramètres
     */
    async getAll() {
        const cacheKey = 'all_settings';
        const cached = settingsCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        const { rows } = await db.query('SELECT key, value FROM platform_settings');
        const data = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        settingsCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    },

    /**
     * Récupère un paramètre spécifique
     */
    async get(key) {
        const cached = settingsCache.get(key);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        const { rows } = await db.query('SELECT value FROM platform_settings WHERE key = $1', [key]);
        const value = rows[0] ? rows[0].value : null;

        settingsCache.set(key, { data: value, timestamp: Date.now() });
        return value;
    },

    /**
     * Met à jour un paramètre
     */
    async update(key, value) {
        const { rows } = await db.query(
            'INSERT INTO platform_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW() RETURNING *',
            [key, JSON.stringify(value)]
        );
        
        // Invalider le cache
        settingsCache.delete(key);
        settingsCache.delete('all_settings');
        
        return rows[0];
    }
};

module.exports = PlatformSettings;
