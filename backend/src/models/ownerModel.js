const db = require('../config/db');

const Owner = {
    /**
     * Get owner profile by ID
     */
    async findProfileById(id) {
        const [profiles] = await db.query('SELECT * FROM owner_profiles WHERE id = ?', [id]);
        return profiles[0] || null;
    },

    /**
     * Update or create owner profile
     */
    async updateProfile(id, data) {
        const { full_name, company_name, phone, address, bio, signature_url } = data;
        // contact_phone et contact_email sont ignorés car les colonnes n'existent pas

        // Mettre à jour user_profiles si full_name est fourni
        if (full_name) {
            await db.query(
                'UPDATE user_profiles SET full_name = ? WHERE id = ?',
                [full_name, id]
            );
        }

        // Vérifier si le profil owner existe
        const [profiles] = await db.query('SELECT id FROM owner_profiles WHERE id = ?', [id]);

        if (profiles.length === 0) {
            // Créer le profil owner (colonnes existantes uniquement)
            await db.query(
                'INSERT INTO owner_profiles (id, user_profile_id, company_name, phone, address, bio, signature_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, id, company_name, phone, address, bio, signature_url]
            );
        } else {
            // Mettre à jour le profil owner (colonnes existantes uniquement)
            await db.query(
                'UPDATE owner_profiles SET company_name = ?, phone = ?, address = ?, bio = ?, signature_url = ?, updated_at = NOW() WHERE id = ?',
                [company_name, phone, address, bio, signature_url, id]
            );
        }

        // Récupérer le profil mis à jour
        const [updatedProfile] = await db.query('SELECT * FROM owner_profiles WHERE id = ?', [id]);
        return updatedProfile[0] || { id, ...data };
    }
};

module.exports = Owner;
