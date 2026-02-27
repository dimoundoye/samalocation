const db = require('../config/db');

const Owner = {
    async findProfileById(id) {
        const { rows } = await db.query('SELECT * FROM owner_profiles WHERE id = $1', [id]);
        return rows[0] || null;
    },

    async updateProfile(id, data) {
        const {
            full_name,
            company_name,
            phone,
            address,
            bio,
            signature_url,
            id_card_url,
            ownership_proof_url,
            liveness_selfie_url,
            verification_status,
            receipt_template
        } = data;

        if (full_name) {
            await db.query(
                'UPDATE user_profiles SET full_name = $1 WHERE id = $2',
                [full_name, id]
            );
        }

        const { rows: profiles } = await db.query('SELECT id FROM owner_profiles WHERE id = $1', [id]);

        if (profiles.length === 0) {
            await db.query(
                'INSERT INTO owner_profiles (id, user_profile_id, company_name, phone, address, bio, signature_url, id_card_url, ownership_proof_url, liveness_selfie_url, verification_status, receipt_template) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                [
                    id,
                    id,
                    company_name || null,
                    phone || null,
                    address || null,
                    bio || null,
                    signature_url || null,
                    id_card_url || null,
                    ownership_proof_url || null,
                    liveness_selfie_url || null,
                    verification_status || 'none',
                    receipt_template || 'classic'
                ]
            );
        } else {
            await db.query(
                'UPDATE owner_profiles SET company_name = $1, phone = $2, address = $3, bio = $4, signature_url = $5, id_card_url = $6, ownership_proof_url = $7, liveness_selfie_url = $8, verification_status = $9, receipt_template = $10, updated_at = NOW() WHERE id = $11',
                [
                    company_name || null,
                    phone || null,
                    address || null,
                    bio || null,
                    signature_url || null,
                    id_card_url || null,
                    ownership_proof_url || null,
                    liveness_selfie_url || null,
                    verification_status || 'none',
                    receipt_template || 'classic',
                    id
                ]
            );
        }

        const { rows: updatedProfile } = await db.query('SELECT * FROM owner_profiles WHERE id = $1', [id]);
        return updatedProfile[0] || { id, ...data };
    }
};

module.exports = Owner;
