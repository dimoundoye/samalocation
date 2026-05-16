-- Migration to add frozen names and contacts to contracts and receipts for legal immutability
-- Created: 2026-05-16

-- 1. Update rental_contracts table
ALTER TABLE rental_contracts 
ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255), 
ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255);

-- 2. Update receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255), 
ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS tenant_phone VARCHAR(50);

-- Note: No data migration needed as the application code handles fallbacks for existing records.
