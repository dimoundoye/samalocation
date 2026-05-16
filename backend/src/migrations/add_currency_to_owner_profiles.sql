-- Migration to add currency to owner_profiles
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'XOF';
