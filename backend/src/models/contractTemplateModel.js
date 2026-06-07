const db = require('../config/db');

const ContractTemplate = {
    async migrate() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS custom_contract_templates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL DEFAULT 'Mon modèle de contrat',
                content TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE INDEX IF NOT EXISTS idx_custom_templates_owner ON custom_contract_templates(owner_id)`,
            `ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS custom_content TEXT`,
            `ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS custom_template_id UUID`
        ];

        for (const sql of queries) {
            try {
                await db.query(sql);
            } catch (err) {
                console.error('[Migration] contractTemplateModel error:', err.message);
            }
        }
        return true;
    },

    async findByOwnerId(ownerId) {
        const { rows } = await db.query(
            `SELECT * FROM custom_contract_templates WHERE owner_id = $1 ORDER BY updated_at DESC`,
            [ownerId]
        );
        return rows;
    },

    async findById(id, ownerId) {
        const { rows } = await db.query(
            `SELECT * FROM custom_contract_templates WHERE id = $1 AND owner_id = $2`,
            [id, ownerId]
        );
        return rows[0] || null;
    },

    async create(ownerId, title, content) {
        const { rows } = await db.query(
            `INSERT INTO custom_contract_templates (owner_id, title, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [ownerId, title, content]
        );
        return rows[0];
    },

    async update(id, ownerId, title, content) {
        const { rows } = await db.query(
            `UPDATE custom_contract_templates
             SET title = $3, content = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND owner_id = $2
             RETURNING *`,
            [id, ownerId, title, content]
        );
        return rows[0] || null;
    },

    async delete(id, ownerId) {
        const { rowCount } = await db.query(
            `DELETE FROM custom_contract_templates WHERE id = $1 AND owner_id = $2`,
            [id, ownerId]
        );
        return rowCount > 0;
    }
};

module.exports = ContractTemplate;
