-- Ajouter la colonne receipt_template à owner_profiles
ALTER TABLE owner_profiles 
ADD COLUMN IF NOT EXISTS receipt_template VARCHAR(50) DEFAULT 'classic';
