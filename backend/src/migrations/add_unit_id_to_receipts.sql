-- Migration: Ajouter unit_id à la table receipts
-- Date: 2026-02-08

ALTER TABLE receipts ADD COLUMN unit_id VARCHAR(36) AFTER property_id;

-- Mettre à jour les reçus existants en essayant de trouver le unit_id via le tenant_id
UPDATE receipts r
JOIN tenants t ON r.tenant_id = t.user_id OR r.tenant_id = t.id
SET r.unit_id = t.unit_id
WHERE r.unit_id IS NULL;

-- Ajouter l'index
CREATE INDEX idx_unit_id ON receipts(unit_id);
