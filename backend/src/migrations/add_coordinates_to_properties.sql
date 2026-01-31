-- Migration: Add coordinates to properties table
ALTER TABLE `properties` 
ADD COLUMN `latitude` DECIMAL(10, 8) NULL DEFAULT NULL AFTER `address`,
ADD COLUMN `longitude` DECIMAL(11, 8) NULL DEFAULT NULL AFTER `latitude`;

-- Update existing properties with some default coordinates (center of Dakar if none provided)
UPDATE `properties` SET `latitude` = 14.7167, `longitude` = -17.4677 WHERE `latitude` IS NULL;
