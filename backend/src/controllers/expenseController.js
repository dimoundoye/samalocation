const Expense = require('../models/expenseModel');
const db = require('../config/db');

const expenseController = {
    async getExpenses(req, res) {
        try {
            const ownerId = req.ownerId || req.user.id;
            const { year, month, property_id, group_id, category } = req.query;

            const filters = {};
            if (year) filters.year = parseInt(year);
            if (month) filters.month = parseInt(month);
            if (property_id) filters.property_id = property_id;
            if (group_id) filters.group_id = group_id;
            if (category) filters.category = category;

            const expenses = await Expense.findAllByOwnerId(ownerId, filters);
            res.json({ status: 'success', data: expenses });
        } catch (error) {
            console.error('Error fetching expenses:', error);
            res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération des dépenses' });
        }
    },

    async createExpense(req, res) {
        try {
            const ownerId = req.ownerId || req.user.id;
            const {
                id,
                property_id,
                group_id,
                category,
                amount,
                expense_date,
                description,
                receipt_url,
                is_recurring,
                recurrence_period
            } = req.body;

            console.log('💰 [EXPENSE CREATE] Input payload:', { ownerId, category, amount, property_id, group_id, expense_date });

            if (!category || amount === undefined || amount === null) {
                return res.status(400).json({ status: 'error', message: 'La catégorie et le montant sont requis' });
            }

            // Ensure expense_date is formatted as YYYY-MM-DD
            let formattedDate = expense_date;
            if (!formattedDate) {
                formattedDate = new Date().toISOString().split('T')[0];
            } else if (formattedDate.includes('T')) {
                formattedDate = formattedDate.split('T')[0];
            }

            const expense = await Expense.create({
                id,
                owner_id: ownerId,
                property_id: property_id || null,
                group_id: group_id || null,
                category,
                amount: parseFloat(amount),
                expense_date: formattedDate,
                description,
                receipt_url,
                is_recurring: !!is_recurring,
                recurrence_period: recurrence_period || 'mensuel'
            });

            console.log('✅ [EXPENSE CREATE] Created expense in DB:', expense);
            res.status(201).json({ status: 'success', data: expense });
        } catch (error) {
            console.error('❌ [EXPENSE CREATE] Error creating expense:', error);
            res.status(500).json({ status: 'error', message: 'Erreur lors de la création de la dépense' });
        }
    },

    async updateExpense(req, res) {
        try {
            const ownerId = req.ownerId || req.user.id;
            const { id } = req.params;

            const updated = await Expense.update(id, ownerId, req.body);
            if (!updated) {
                return res.status(404).json({ status: 'error', message: 'Dépense introuvable' });
            }

            res.json({ status: 'success', data: updated });
        } catch (error) {
            console.error('Error updating expense:', error);
            res.status(500).json({ status: 'error', message: 'Erreur lors de la modification de la dépense' });
        }
    },

    async deleteExpense(req, res) {
        try {
            const ownerId = req.ownerId || req.user.id;
            const { id } = req.params;

            const deleted = await Expense.delete(id, ownerId);
            if (!deleted) {
                return res.status(404).json({ status: 'error', message: 'Dépense introuvable' });
            }

            res.json({ status: 'success', message: 'Dépense supprimée avec succès' });
        } catch (error) {
            console.error('Error deleting expense:', error);
            res.status(500).json({ status: 'error', message: 'Erreur lors de la suppression' });
        }
    },

    async getAnalytics(req, res) {
        try {
            const ownerId = req.ownerId || req.user.id;
            const year = parseInt(req.query.year) || new Date().getFullYear();
            const propertyId = req.query.property_id || null;
            const groupId = req.query.group_id || null;

            // Fetch owner-related IDs strictly for target ownerId
            const { rows: ownerRows } = await db.query(
                `SELECT id, user_profile_id FROM owner_profiles WHERE id = $1 OR user_profile_id = $1`,
                [ownerId]
            );
            const ownerIdsSet = new Set([ownerId]);
            ownerRows.forEach(r => {
                if (r.id) ownerIdsSet.add(r.id);
                if (r.user_profile_id) ownerIdsSet.add(r.user_profile_id);
            });
            const ownerIdsList = Array.from(ownerIdsSet);

            // Fetch dynamic distinct available years from receipts and expenses
            const { rows: yearRows } = await db.query(`
                SELECT DISTINCT year FROM (
                    SELECT COALESCE(NULLIF(r.year::text, ''), EXTRACT(YEAR FROM r.payment_date)::text, EXTRACT(YEAR FROM r.created_at)::text)::integer as year
                    FROM receipts r
                    LEFT JOIN properties p ON r.property_id = p.id
                    WHERE (p.owner_id = ANY($1) OR r.tenant_id = ANY($1))
                    
                    UNION
                    
                    SELECT EXTRACT(YEAR FROM e.expense_date)::integer as year
                    FROM property_expenses e
                    LEFT JOIN properties p ON e.property_id = p.id
                    WHERE (e.owner_id = ANY($1) OR p.owner_id = ANY($1))
                ) combined_years
                WHERE year IS NOT NULL
                ORDER BY year DESC
            `, [ownerIdsList]);

            let availableYears = yearRows.map(r => parseInt(r.year)).filter(Boolean);
            const currentSysYear = new Date().getFullYear();
            if (!availableYears.includes(currentSysYear)) {
                availableYears.push(currentSysYear);
            }
            availableYears.sort((a, b) => b - a);

            // 1. Fetch expenses for target year
            let expensesQuery = `
                SELECT e.*, p.name as property_name 
                FROM property_expenses e 
                LEFT JOIN properties p ON e.property_id = p.id 
                WHERE (e.owner_id = ANY($1) OR p.owner_id = ANY($1))
                  AND EXTRACT(YEAR FROM e.expense_date) = $2
            `;
            const expensesValues = [ownerIdsList, year];
            let expIdx = 3;

            if (propertyId) {
                expensesQuery += ` AND e.property_id = $${expIdx++}`;
                expensesValues.push(propertyId);
            }

            if (groupId) {
                expensesQuery += ` AND e.group_id = $${expIdx++}`;
                expensesValues.push(groupId);
            }

            expensesQuery += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

            const { rows: expenses } = await db.query(expensesQuery, expensesValues);

            // 2. Fetch receipts (revenues) strictly for target year
            let receiptsQuery = `
                SELECT r.* 
                FROM receipts r
                LEFT JOIN properties p ON r.property_id = p.id
                WHERE (p.owner_id = ANY($1) OR r.tenant_id = ANY($1))
                  AND COALESCE(r.status, 'valid') <> 'cancelled'
                  AND COALESCE(NULLIF(r.year::text, ''), EXTRACT(YEAR FROM r.payment_date)::text, EXTRACT(YEAR FROM r.created_at)::text)::integer = $2
            `;
            const receiptsValues = [ownerIdsList, year];

            if (propertyId) {
                receiptsQuery += ` AND r.property_id = $${receiptsValues.length + 1}`;
                receiptsValues.push(propertyId);
            }

            if (groupId) {
                const { rows: groupRows } = await db.query(
                    `SELECT property_ids FROM property_groups WHERE owner_id = ANY($1) AND id = $2`,
                    [ownerIdsList, groupId]
                );
                const propertyIds = (groupRows[0]?.property_ids || []).filter(Boolean);
                if (propertyIds.length > 0) {
                    receiptsQuery += ` AND r.property_id = ANY($${receiptsValues.length + 1})`;
                    receiptsValues.push(propertyIds);
                }
            }

            const { rows: receipts } = await db.query(receiptsQuery, receiptsValues);

            // 3. Compute totals
            const totalRevenue = receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
            const totalExpense = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            const netCashFlow = totalRevenue - totalExpense;

            // 4. Monthly Breakdown (Jan - Dec)
            const monthlyData = Array.from({ length: 12 }, (_, i) => {
                const monthNum = i + 1;
                const monthRevenues = receipts
                    .filter(r => {
                        const rMonth = parseInt(r.month) || (r.payment_date ? new Date(r.payment_date).getMonth() + 1 : (r.created_at ? new Date(r.created_at).getMonth() + 1 : 0));
                        return rMonth === monthNum;
                    })
                    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

                const monthExpenses = expenses
                    .filter(e => new Date(e.expense_date).getMonth() + 1 === monthNum)
                    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

                return {
                    month: monthNum,
                    revenue: monthRevenues,
                    expense: monthExpenses,
                    cashFlow: monthRevenues - monthExpenses
                };
            });

            // 5. Category Breakdown
            const categoryBreakdownMap = {};
            expenses.forEach(e => {
                const cat = e.category || 'autre';
                const amt = parseFloat(e.amount) || 0;
                categoryBreakdownMap[cat] = (categoryBreakdownMap[cat] || 0) + amt;
            });

            const categoryBreakdown = Object.keys(categoryBreakdownMap).map(cat => ({
                category: cat,
                amount: categoryBreakdownMap[cat]
            }));

            // 6. Occupancy Rate estimation
            let occupancyQuery = `
                SELECT 
                    COUNT(DISTINCT pu.id) as total_units,
                    COUNT(DISTINCT CASE WHEN t.id IS NOT NULL AND (t.status = 'active' OR t.status IS NULL) THEN pu.id END) as occupied_units
                FROM properties p
                LEFT JOIN property_units pu ON pu.property_id = p.id
                LEFT JOIN tenants t ON t.unit_id = pu.id AND (t.status = 'active' OR t.status IS NULL)
                WHERE p.owner_id = ANY($1)
            `;
            const occupancyValues = [ownerIdsList];
            if (propertyId) {
                occupancyQuery += ` AND p.id = $${occupancyValues.length + 1}`;
                occupancyValues.push(propertyId);
            }
            if (groupId) {
                const { rows: groupRows } = await db.query(
                    `SELECT property_ids FROM property_groups WHERE owner_id = ANY($1) AND id = $2`,
                    [ownerIdsList, groupId]
                );
                const propertyIds = (groupRows[0]?.property_ids || []).filter(Boolean);
                if (propertyIds.length > 0) {
                    occupancyQuery += ` AND p.id = ANY($${occupancyValues.length + 1})`;
                    occupancyValues.push(propertyIds);
                }
            }
            const { rows: occupancyRows } = await db.query(occupancyQuery, occupancyValues);
            
            let totalUnits = parseInt(occupancyRows[0]?.total_units || 0);
            let occupiedUnits = parseInt(occupancyRows[0]?.occupied_units || 0);

            if (totalUnits === 0) {
                const { rows: fallbackRows } = await db.query(`
                    SELECT 
                        COUNT(DISTINCT p.id) as total_props,
                        COUNT(DISTINCT CASE WHEN t.id IS NOT NULL THEN p.id END) as occupied_props
                    FROM properties p
                    -- tenants n'a pas de property_id : le locataire est rattaché au bien via son unité
                    LEFT JOIN tenants t ON t.unit_id IN (SELECT id FROM property_units WHERE property_id = p.id) AND (t.status = 'active' OR t.status IS NULL)
                    WHERE p.owner_id = ANY($1)
                `, [ownerIdsList]);
                totalUnits = parseInt(fallbackRows[0]?.total_props || 0);
                occupiedUnits = parseInt(fallbackRows[0]?.occupied_props || 0);
            }

            const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

            res.json({
                status: 'success',
                data: {
                    year,
                    availableYears,
                    totalRevenue,
                    totalExpense,
                    netCashFlow,
                    occupancyRate,
                    totalUnits,
                    occupiedUnits,
                    monthlyData,
                    categoryBreakdown,
                    expenses
                }
            });
        } catch (error) {
            console.error('Error fetching financial analytics:', error);
            res.status(500).json({ status: 'error', message: 'Erreur lors du calcul des statistiques financières' });
        }
    }
};

module.exports = expenseController;
