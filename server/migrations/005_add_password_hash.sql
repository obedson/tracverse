-- Add password_hash column to users table for authentication
-- This migration adds the password_hash column if it doesn't exist

-- Add password_hash column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
END $$;

-- Add total_earnings column for dashboard metrics
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_earnings'
    ) THEN
        ALTER TABLE users ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);

-- Update existing users with default values if needed
UPDATE users SET total_earnings = 0 WHERE total_earnings IS NULL;
