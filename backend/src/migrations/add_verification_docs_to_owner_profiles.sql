-- Migration pour ajouter les colonnes de vérification étendue pour les propriétaires
ALTER TABLE owner_profiles 
ADD COLUMN ownership_proof_url TEXT,
ADD COLUMN liveness_selfie_url TEXT;

-- Commentaire pour expliquer les colonnes
COMMENT ON COLUMN owner_profiles.ownership_proof_url IS 'URL de la preuve de propriété (Titre Foncier ou facture)';
COMMENT ON COLUMN owner_profiles.liveness_selfie_url IS 'URL du selfie du propriétaire avec son ID';
