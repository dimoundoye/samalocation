-- Migration : Système de Dossier Digital Locatif

-- 1. Table des dossiers locatifs
CREATE TABLE IF NOT EXISTS tenant_dossiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Situation professionnelle
    profession VARCHAR(100),
    contract_type VARCHAR(50), -- CDI, CDD, Freelance, Étudiant, etc.
    employer_name VARCHAR(150),
    monthly_income DECIMAL(15, 2),
    profession_since DATE,
    
    -- Documents (URLs sécurisées)
    cni_url TEXT,
    last_three_payslips JSONB DEFAULT '[]', -- Liste d'URLs
    tax_notice_url TEXT,
    employment_certificate_url TEXT,
    proof_of_residence_url TEXT,
    
    -- Garant (Optionnel)
    has_guarantor BOOLEAN DEFAULT FALSE,
    guarantor_info JSONB DEFAULT '{}', -- { name, phone, income, documents: [] }
    
    -- Métadonnées
    is_complete BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 2. Table des partages de dossiers (Autorisations)
CREATE TABLE IF NOT EXISTS dossier_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dossier_id UUID NOT NULL REFERENCES tenant_dossiers(id) ON DELETE CASCADE,
    owner_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(255) REFERENCES properties(id) ON DELETE SET NULL, -- Le bien spécifique visé (optionnel)
    
    status VARCHAR(20) DEFAULT 'active', -- active, revoked, expired
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(dossier_id, owner_id, property_id)
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_tenant_dossiers_user_id ON tenant_dossiers(user_id);
CREATE INDEX IF NOT EXISTS idx_dossier_shares_owner_id ON dossier_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_dossier_shares_dossier_id ON dossier_shares(dossier_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenant_dossiers_updated_at
    BEFORE UPDATE ON tenant_dossiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
