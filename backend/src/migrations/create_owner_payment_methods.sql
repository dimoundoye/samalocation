-- Paiement direct du loyer : le locataire paie le propriétaire (Wave, Orange Money, virement…),
-- la plateforme ne détient jamais l'argent.

-- Coordonnées de paiement du propriétaire. Table séparée de owner_profiles pour ne jamais
-- les exposer avec le profil public : seuls les locataires ayant un bail actif les voient.
CREATE TABLE IF NOT EXISTS owner_payment_methods (
    owner_id VARCHAR(36) PRIMARY KEY,
    methods JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(36)
);
