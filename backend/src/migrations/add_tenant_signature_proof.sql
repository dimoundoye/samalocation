-- Signature manuscrite du locataire : preuve associée
-- L'image de la signature (PNG en data URL) est stockée dans la colonne existante tenant_signature.
-- tenant_signature_proof garde les éléments qui consolident la signature :
--   { custom_id, name, signed_at, ip, user_agent, document_hash }
-- document_hash (colonne existante) reçoit l'empreinte SHA-256 du contenu du contrat au moment de la signature.

ALTER TABLE rental_contracts
    ADD COLUMN IF NOT EXISTS tenant_signature_proof JSONB;
