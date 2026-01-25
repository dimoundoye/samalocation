const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Receipt = {
    /**
     * Créer un nouveau reçu
     */
    async create(data) {
        const {
            tenant_id,
            property_id,
            month,
            year,
            amount,
            payment_date,
            payment_method = 'virement',
            notes = null
        } = data;

        const id = uuidv4();
        const receipt_number = await this.generateReceiptNumber();

        const [result] = await db.query(
            `INSERT INTO receipts 
            (id, tenant_id, property_id, month, year, amount, payment_date, payment_method, receipt_number, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, tenant_id, property_id, month, year, amount, payment_date, payment_method, receipt_number, notes]
        );

        return this.findById(id);
    },

    /**
     * Générer un numéro de reçu unique
     */
    async generateReceiptNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        // Compter les reçus du mois en cours
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM receipts WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?',
            [year, new Date().getMonth() + 1]
        );

        const count = rows[0].count + 1;
        const sequence = String(count).padStart(4, '0');

        return `REC-${year}${month}-${sequence}`;
    },

    /**
     * Récupérer un reçu par ID avec toutes les informations
     */
    async findById(id) {
        console.log('🔍 findById called for receipt:', id);
        const [receipts] = await db.query(
            `SELECT 
                r.*,
                tenant.full_name as tenant_name,
                tenant.email as tenant_email,
                tenant.phone as tenant_phone,
                owner.full_name as owner_name,
                owner.email as owner_email,
                owner.phone as owner_phone,
                owner_prof.signature_url,
                p.name as property_name,
                p.address as property_address,
                pu.unit_number,
                t.monthly_rent as tenant_rent,
                t.move_in_date
            FROM receipts r
            LEFT JOIN user_profiles tenant ON r.tenant_id = tenant.id
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN user_profiles owner ON p.owner_id = owner.id
            LEFT JOIN owner_profiles owner_prof ON p.owner_id = owner_prof.id
            LEFT JOIN property_units pu ON r.property_id = pu.property_id AND (
                EXISTS (SELECT 1 FROM tenants t2 WHERE t2.user_id = r.tenant_id AND t2.unit_id = pu.id)
            )
            LEFT JOIN tenants t ON t.user_id = r.tenant_id
            WHERE r.id = ?`,
            [id]
        );

        return receipts[0] || null;
    },

    /**
     * Récupérer tous les reçus d'un locataire
     */
    async findByTenantId(tenantId) {
        const [receipts] = await db.query(
            `SELECT 
                r.*,
                p.name as property_name,
                p.address as property_address,
                owner.full_name as owner_name
            FROM receipts r
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN user_profiles owner ON p.owner_id = owner.id
            WHERE r.tenant_id = ?
            ORDER BY r.created_at DESC`,
            [tenantId]
        );

        return receipts;
    },

    /**
     * Récupérer tous les reçus créés pour les locataires d'un propriétaire
     */
    async findByOwnerId(ownerId) {
        const [receipts] = await db.query(
            `SELECT 
                r.*,
                tenant.full_name as tenant_name,
                p.name as property_name,
                p.address as property_address
            FROM receipts r
            LEFT JOIN properties p ON r.property_id = p.id
            LEFT JOIN user_profiles tenant ON r.tenant_id = tenant.id
            WHERE p.owner_id = ?
            ORDER BY r.created_at DESC`,
            [ownerId]
        );

        return receipts;
    },

    /**
     * Supprimer un reçu
     */
    async delete(id) {
        await db.query('DELETE FROM receipts WHERE id = ?', [id]);
        return true;
    }
};

module.exports = Receipt;
