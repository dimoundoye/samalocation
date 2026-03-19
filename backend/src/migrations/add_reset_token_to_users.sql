-- Migration script to add reset password columns to users table
-- Run this if forgot password is not working due to missing columns

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;

-- Also add verification columns while we are at it
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
