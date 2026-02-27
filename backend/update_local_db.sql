-- Consolidated Update Script for samalocation local database
-- To be applied AFTER importing samal2728987.sql

USE samalocation;

-- 1. Add unit_id to receipts
ALTER TABLE receipts ADD COLUMN unit_id VARCHAR(36) AFTER property_id;
UPDATE receipts r
JOIN tenants t ON r.tenant_id = t.user_id OR r.tenant_id = t.id
SET r.unit_id = t.unit_id
WHERE r.unit_id IS NULL;
CREATE INDEX idx_unit_id ON receipts(unit_id);

-- 2. Add custom_id to users and user_profiles
ALTER TABLE users ADD COLUMN custom_id VARCHAR(10) UNIQUE AFTER id;
ALTER TABLE user_profiles ADD COLUMN custom_id VARCHAR(10) AFTER id;

-- 3. Add is_setup_complete to users
ALTER TABLE users ADD COLUMN is_setup_complete BOOLEAN DEFAULT TRUE;
UPDATE users SET is_setup_complete = TRUE;

-- 4. Add coordinates to properties
ALTER TABLE `properties` 
ADD COLUMN `latitude` DECIMAL(10, 8) NULL DEFAULT NULL AFTER `address`,
ADD COLUMN `longitude` DECIMAL(11, 8) NULL DEFAULT NULL AFTER `latitude`;
UPDATE `properties` SET `latitude` = 14.7167, `longitude` = -17.4677 WHERE `latitude` IS NULL;
