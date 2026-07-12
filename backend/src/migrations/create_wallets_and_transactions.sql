-- Migration: Création du système de portefeuille propriétaire et transactions
-- Date: 2026-07-11

-- 1. Ajouter les colonnes de solde et de configuration du paiement en ligne dans owner_profiles
ALTER TABLE owner_profiles 
ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Créer la table ledger_transactions pour l'historique comptable
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id VARCHAR(36) NOT NULL REFERENCES owner_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'pay_rent', 'withdraw', 'subscription_fee', 'force_withdrawal'
    amount DECIMAL(12, 2) NOT NULL,
    fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    platform_surplus DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    description TEXT,
    reference_id VARCHAR(100), -- ID du reçu ou token de transaction PayDunya
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour ledger_transactions
CREATE INDEX IF NOT EXISTS idx_ledger_owner_id ON ledger_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger_transactions(created_at);

-- 3. Créer la table withdrawals pour suivre les demandes de retrait des propriétaires
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id VARCHAR(36) NOT NULL REFERENCES owner_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(12, 2) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'wave', 'orange_money', 'free_money', 'bank'
    recipient_details VARCHAR(100) NOT NULL, -- Numéro de téléphone ou RIB
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    transaction_id VARCHAR(100), -- ID de virement PayDunya (Disbursement)
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_owner_id ON withdrawals(owner_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);
