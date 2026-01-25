-- Migration: Add custom_id to users and user_profiles
ALTER TABLE users ADD COLUMN custom_id VARCHAR(10) UNIQUE AFTER id;
ALTER TABLE user_profiles ADD COLUMN custom_id VARCHAR(10) AFTER id;

-- Update existing users with a placeholder or legacy ID if needed
-- For now, we'll just leave them null or let the system handle them
