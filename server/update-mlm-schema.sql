-- MLM Schema Updates for Tracverse Platform

-- Add membership_price column for earnings cap calculations
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_price DECIMAL(10,2) DEFAULT 25000;

-- Create referrals table (missing from current schema)
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Add commission_type enum values
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS commission_type VARCHAR(50) DEFAULT 'unilevel';

-- Add earnings tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS earnings_cap DECIMAL(10,2) DEFAULT 37500;

-- Update existing users with proper earnings caps
UPDATE users SET earnings_cap = membership_price * 1.5 WHERE membership_price IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_type ON commissions(type);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Add constraints
ALTER TABLE commissions ADD CONSTRAINT IF NOT EXISTS chk_commission_amount CHECK (amount >= 0);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS chk_earnings_positive CHECK (total_earnings >= 0);
