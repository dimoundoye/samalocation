-- Migration: Création de la table receipts pour les quittances de loyer
-- Date: 2026-01-11

CREATE TABLE IF NOT EXISTS receipts (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    property_id VARCHAR(36) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'virement',
    receipt_number VARCHAR(50) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_property_id (property_id),
    INDEX idx_month_year (month, year),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vérification
SELECT 'Table receipts créée avec succès' as message;
