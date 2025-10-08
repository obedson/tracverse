-- MLM Referral Tree Structure
-- Migration: 001_mlm_referral_tree.sql
-- Run AFTER 000_base_schema.sql

-- Add MLM columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank VARCHAR(20) DEFAULT 'bronze';
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_volume DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_volume DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_status BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP DEFAULT NOW();

-- Referral Tree table for genealogy tracking
CREATE TABLE IF NOT EXISTS referral_tree (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    upline_id UUID REFERENCES users(id) ON DELETE SET NULL,
    position VARCHAR(10), -- 'left', 'right' for binary, or 'direct' for unilevel
    level INTEGER NOT NULL DEFAULT 1,
    placement_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    commission_type VARCHAR(20) NOT NULL, -- 'direct', 'level', 'matching', 'rank'
    level INTEGER DEFAULT 1,
    task_id UUID, -- Reference to link_clicks or future tasks table
    period VARCHAR(7), -- YYYY-MM format
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Ranks table
CREATE TABLE IF NOT EXISTS user_ranks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank VARCHAR(20) NOT NULL,
    achieved_date TIMESTAMP DEFAULT NOW(),
    personal_volume DECIMAL(10,2) NOT NULL,
    team_volume DECIMAL(10,2) NOT NULL,
    active_downlines INTEGER DEFAULT 0,
    direct_referrals INTEGER DEFAULT 0,
    is_current BOOLEAN DEFAULT true
);

-- Rank Qualifications tracking
CREATE TABLE IF NOT EXISTS rank_qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    personal_volume DECIMAL(10,2) DEFAULT 0,
    team_volume DECIMAL(10,2) DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    direct_referrals INTEGER DEFAULT 0,
    qualified BOOLEAN DEFAULT false,
    rank_achieved VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, period)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_sponsor ON referral_tree(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_referral_upline ON referral_tree(upline_id);
CREATE INDEX IF NOT EXISTS idx_referral_level ON referral_tree(level);
CREATE INDEX IF NOT EXISTS idx_commission_user ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_period ON commissions(period);
CREATE INDEX IF NOT EXISTS idx_commission_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_rank_user ON user_ranks(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_current ON user_ranks(is_current);
CREATE INDEX IF NOT EXISTS idx_qualification_period ON rank_qualifications(period);

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

-- Trigger to auto-generate referral codes
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_set_referral_code
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_referral_code();
