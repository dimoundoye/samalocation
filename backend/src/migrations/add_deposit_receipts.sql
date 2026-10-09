-- Reçus de caution (dépôt de garantie) et restitution de la caution en fin de bail.
-- - receipts.receipt_type : 'rent' (quittance de loyer, valeur de tous les reçus existants) ou 'deposit' (caution).
--   Une caution n'est pas un revenu : elle est exclue des revenus, des mois payés et du quota de quittances.
-- - deposit_settlements : décompte de restitution d'une caution (restituée en totalité, en partie avec retenues,
--   ou entièrement retenue). Une seule restitution valide par caution ; une restitution annulée reste en historique.
--   Pas de clé étrangère vers receipts : le lien est géré par le code (le type de receipts.id varie selon les bases).
-- Idempotent.

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_type VARCHAR(20) NOT NULL DEFAULT 'rent';
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_type ON receipts (receipt_type);

CREATE TABLE IF NOT EXISTS deposit_settlements (
    id                  VARCHAR(36) PRIMARY KEY,
    deposit_receipt_id  VARCHAR(255) NOT NULL,
    settlement_number   VARCHAR(50) NOT NULL UNIQUE,
    deposit_amount      NUMERIC(14, 2) NOT NULL,
    refunded_amount     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    retained_amount     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    deductions          JSONB NOT NULL DEFAULT '[]'::jsonb,
    settlement_date     DATE NOT NULL,
    payment_method      VARCHAR(50),
    notes               TEXT,
    owner_signature     TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'valid',
    cancellation_reason TEXT,
    cancelled_at        TIMESTAMP,
    cancelled_by        VARCHAR(255),
    created_by          VARCHAR(255),
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposit_settlements_receipt ON deposit_settlements (deposit_receipt_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposit_settlements_one_valid
    ON deposit_settlements (deposit_receipt_id) WHERE status = 'valid';
