const db = require('../config/db');

const Owner = {
    async findProfileById(id) {
        const { rows } = await db.query('SELECT * FROM owner_profiles WHERE id = $1', [id]);
        return rows[0] || null;
    },

    async updateProfile(id, data) {
        // Fetch current profile to merge
        const currentProfile = await this.findProfileById(id);
        
        const {
            full_name,
            company_name = currentProfile?.company_name,
            phone = currentProfile?.phone,
            address = currentProfile?.address,
            bio = currentProfile?.bio,
            signature_url = currentProfile?.signature_url,
            id_card_url = currentProfile?.id_card_url,
            ownership_proof_url = currentProfile?.ownership_proof_url,
            liveness_selfie_url = currentProfile?.liveness_selfie_url,
            verification_status = currentProfile?.verification_status,
            receipt_template = currentProfile?.receipt_template,
            logo_url = currentProfile?.logo_url,
            prestations = currentProfile?.prestations,
            horaires = currentProfile?.horaires,
            social_links = currentProfile?.social_links,
            banner_url = currentProfile?.banner_url,
            external_email = currentProfile?.external_email,
            website = currentProfile?.website
        } = data;

        if (full_name) {
            await db.query(
                'UPDATE user_profiles SET full_name = $1 WHERE id = $2',
                [full_name, id]
            );
        }

        if (!currentProfile) {
            await db.query(
                'INSERT INTO owner_profiles (id, user_profile_id, company_name, phone, address, bio, signature_url, id_card_url, ownership_proof_url, liveness_selfie_url, verification_status, receipt_template, logo_url, prestations, horaires, social_links, banner_url, external_email, website) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)',
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
                    receipt_template || 'classic',
                    logo_url || null,
                    JSON.stringify(prestations || []),
                    JSON.stringify(horaires || {}),
                    JSON.stringify(social_links || {}),
                    banner_url || null,
                    external_email || null,
                    website || null
                ]
            );
        } else {
            await db.query(
                'UPDATE owner_profiles SET company_name = $1, phone = $2, address = $3, bio = $4, signature_url = $5, id_card_url = $6, ownership_proof_url = $7, liveness_selfie_url = $8, verification_status = $9, receipt_template = $10, logo_url = $11, prestations = $12, horaires = $13, social_links = $14, banner_url = $15, external_email = $16, website = $17, updated_at = NOW() WHERE id = $18',
                [
                    company_name,
                    phone,
                    address,
                    bio,
                    signature_url,
                    id_card_url,
                    ownership_proof_url,
                    liveness_selfie_url,
                    verification_status,
                    receipt_template,
                    logo_url,
                    typeof prestations === 'string' ? prestations : JSON.stringify(prestations || []),
                    typeof horaires === 'string' ? horaires : JSON.stringify(horaires || {}),
                    typeof social_links === 'string' ? social_links : JSON.stringify(social_links || {}),
                    banner_url,
                    external_email,
                    website,
                    id
                ]
            );
        }

        const { rows: updatedProfile } = await db.query('SELECT * FROM owner_profiles WHERE id = $1', [id]);
        return updatedProfile[0] || { id, ...data };
    }
};

module.exports = Owner;
