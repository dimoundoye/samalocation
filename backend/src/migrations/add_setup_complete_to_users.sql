-- Migration: Add is_setup_complete to users
ALTER TABLE users ADD COLUMN is_setup_complete BOOLEAN DEFAULT TRUE;

-- For already existing users, it's true. 
-- New users created by owners will be set to FALSE explicitly.
UPDATE users SET is_setup_complete = TRUE;
