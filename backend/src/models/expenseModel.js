const db = require('../config/db');

const Expense = {
    async initTable() {
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS property_expenses (
                    id VARCHAR(100) PRIMARY KEY,
                    owner_id VARCHAR(255) NOT NULL,
                    property_id VARCHAR(255) REFERENCES properties(id) ON DELETE SET NULL,
                    group_id VARCHAR(100),
                    category VARCHAR(50) NOT NULL,
                    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
                    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    description TEXT,
                    receipt_url TEXT,
                    is_recurring BOOLEAN DEFAULT FALSE,
                    recurrence_period VARCHAR(20) DEFAULT 'mensuel',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_property_expenses_owner ON property_expenses(owner_id);
                CREATE INDEX IF NOT EXISTS idx_property_expenses_property ON property_expenses(property_id);
                CREATE INDEX IF NOT EXISTS idx_property_expenses_group ON property_expenses(group_id);
                CREATE INDEX IF NOT EXISTS idx_property_expenses_date ON property_expenses(expense_date);
            `);
        } catch (err) {
            console.error('Error initializing property_expenses table:', err.message);
        }
    },

    async create(data) {
        const {
            id,
            owner_id,
            property_id = null,
            group_id = null,
            category,
            amount,
            expense_date,
            description = null,
            receipt_url = null,
            is_recurring = false,
            recurrence_period = 'mensuel'
        } = data;

        const expenseId = id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const { rows } = await db.query(
            `INSERT INTO property_expenses 
            (id, owner_id, property_id, group_id, category, amount, expense_date, description, receipt_url, is_recurring, recurrence_period)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [expenseId, owner_id, property_id || null, group_id || null, category, amount, expense_date || new Date(), description, receipt_url, is_recurring, recurrence_period]
        );
        return rows[0];
    },

    async findAllByOwnerId(ownerId, filters = {}) {
        let query = `SELECT e.*, p.name as property_name 
                     FROM property_expenses e 
                     LEFT JOIN properties p ON e.property_id = p.id 
                     WHERE (
                         e.owner_id = $1 
                         OR e.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1)
                         OR e.owner_id IN (SELECT user_profile_id FROM owner_profiles WHERE id = $1)
                         OR p.owner_id = $1 
                         OR p.owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $1)
                         OR p.owner_id IN (SELECT user_profile_id FROM owner_profiles WHERE id = $1)
                     )`;
        const values = [ownerId];
        let idx = 2;

        if (filters.year) {
            query += ` AND EXTRACT(YEAR FROM e.expense_date) = $${idx}`;
            values.push(filters.year);
            idx++;
        }

        if (filters.month) {
            query += ` AND EXTRACT(MONTH FROM e.expense_date) = $${idx}`;
            values.push(filters.month);
            idx++;
        }

        if (filters.property_id) {
            query += ` AND e.property_id = $${idx}`;
            values.push(filters.property_id);
            idx++;
        }

        if (filters.group_id) {
            query += ` AND e.group_id = $${idx}`;
            values.push(filters.group_id);
            idx++;
        }

        if (filters.category) {
            query += ` AND e.category = $${idx}`;
            values.push(filters.category);
            idx++;
        }

        query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

        const { rows } = await db.query(query, values);
        return rows;
    },

    async update(id, ownerId, data) {
        const {
            property_id,
            group_id,
            category,
            amount,
            expense_date,
            description,
            receipt_url,
            is_recurring,
            recurrence_period
        } = data;

        const { rows } = await db.query(
            `UPDATE property_expenses 
             SET property_id = $1,
                 group_id = $2,
                 category = $3,
                 amount = $4,
                 expense_date = $5,
                 description = $6,
                 receipt_url = $7,
                 is_recurring = $8,
                 recurrence_period = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 AND (
                 owner_id = $11 
                 OR owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $11)
                 OR owner_id IN (SELECT user_profile_id FROM owner_profiles WHERE id = $11)
             )
             RETURNING *`,
            [
                property_id || null,
                group_id || null,
                category,
                amount,
                expense_date,
                description || null,
                receipt_url || null,
                is_recurring || false,
                recurrence_period || 'mensuel',
                id,
                ownerId
            ]
        );
        return rows[0];
    },

    async delete(id, ownerId) {
        const { rows } = await db.query(
            `DELETE FROM property_expenses WHERE id = $1 AND (
                 owner_id = $2 
                 OR owner_id IN (SELECT id FROM owner_profiles WHERE user_profile_id = $2)
                 OR owner_id IN (SELECT user_profile_id FROM owner_profiles WHERE id = $2)
             ) RETURNING *`,
            [id, ownerId]
        );
        return rows[0];
    }
};

// Initialize table on load
Expense.initTable();

module.exports = Expense;
