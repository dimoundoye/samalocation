-- Migration: Création de la table rental_contracts
-- Date: 2026-02-26

CREATE TABLE IF NOT EXISTS rental_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(36) NOT NULL, -- References tenants(id)
    owner_id VARCHAR(36) NOT NULL,  -- References users(id)
    property_id VARCHAR(36) NOT NULL,
    unit_id VARCHAR(36) NOT NULL,
    
    -- Contract Terms
    start_date DATE NOT NULL,
    duration_months INT DEFAULT 12,
    rent_amount DECIMAL(12, 2) NOT NULL,
    deposit_amount DECIMAL(12, 2),
    payment_day INT DEFAULT 5,
    payment_method VARCHAR(50),
    
    -- Status and Signatures
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, terminated, pending_signature
    owner_signed BOOLEAN DEFAULT FALSE,
    tenant_signed BOOLEAN DEFAULT FALSE,
    owner_signed_at TIMESTAMP,
    tenant_signed_at TIMESTAMP,
    
    -- Content and Metadata
    contract_number VARCHAR(50) UNIQUE,
    terms_accepted BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES property_units(id) ON DELETE CASCADE
);

CREATE INDEX idx_contract_tenant ON rental_contracts(tenant_id);
CREATE INDEX idx_contract_owner ON rental_contracts(owner_id);
CREATE INDEX idx_contract_property ON rental_contracts(property_id);
CREATE INDEX idx_contract_status ON rental_contracts(status);
