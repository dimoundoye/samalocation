-- Migration to add listing type and sale price to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'location';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sale_price DECIMAL(15, 2) NULL;

-- Update existing properties to 'location' if listing_type is null
UPDATE properties SET listing_type = 'location' WHERE listing_type IS NULL;
