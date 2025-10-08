-- Fix Users Table for MLM
-- Migration: 002_fix_users_table.sql

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sponsor_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank VARCHAR(20) DEFAULT 'bronze';
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_volume DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_volume DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_status BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP DEFAULT NOW();

-- Create unique constraint on id column
ALTER TABLE users ADD CONSTRAINT users_id_unique UNIQUE (id);

-- Add foreign key constraint for sponsor_id (references id, not user_id)
ALTER TABLE users ADD CONSTRAINT users_sponsor_fk FOREIGN KEY (sponsor_id) REFERENCES users(id);

-- Create referral_tree table (using id instead of user_id for consistency)
CREATE TABLE IF NOT EXISTS referral_tree (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    sponsor_id UUID,
    upline_id UUID,
    position VARCHAR(10) DEFAULT 'direct',
    level INTEGER NOT NULL DEFAULT 1,
    placement_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sponsor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (upline_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    from_user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission_type VARCHAR(20) NOT NULL,
    level INTEGER DEFAULT 1,
    task_id UUID,
    period VARCHAR(7),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_ranks table
CREATE TABLE IF NOT EXISTS user_ranks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rank VARCHAR(20) NOT NULL,
    achieved_date TIMESTAMP DEFAULT NOW(),
    personal_volume DECIMAL(10,2) NOT NULL,
    team_volume DECIMAL(10,2) NOT NULL,
    active_downlines INTEGER DEFAULT 0,
    direct_referrals INTEGER DEFAULT 0,
    is_current BOOLEAN DEFAULT true,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create rank_qualifications table
CREATE TABLE IF NOT EXISTS rank_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    period VARCHAR(7) NOT NULL,
    personal_volume DECIMAL(10,2) DEFAULT 0,
    team_volume DECIMAL(10,2) DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    direct_referrals INTEGER DEFAULT 0,
    qualified BOOLEAN DEFAULT false,
    rank_achieved VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, period),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_sponsor ON referral_tree(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_referral_level ON referral_tree(level);
CREATE INDEX IF NOT EXISTS idx_commission_user ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_period ON commissions(period);

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := 'TRV' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral codes and UUIDs
CREATE OR REPLACE FUNCTION set_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Set UUID if not provided
    IF NEW.id IS NULL THEN
        NEW.id := gen_random_uuid();
    END IF;
    
    -- Set referral code if not provided
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_user_defaults ON users;
CREATE TRIGGER trigger_set_user_defaults
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_user_defaults();
