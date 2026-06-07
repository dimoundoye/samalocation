-- Migration: Création de la table custom_contract_templates
-- Date: 2026-06-06

-- Table pour stocker les modèles de contrat personnalisés des propriétaires
CREATE TABLE IF NOT EXISTS custom_contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Mon modèle de contrat',
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_templates_owner ON custom_contract_templates(owner_id);

-- Ajout de la colonne custom_content dans rental_contracts pour stocker le contenu figé
ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS custom_content TEXT;
ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS custom_template_id UUID;
