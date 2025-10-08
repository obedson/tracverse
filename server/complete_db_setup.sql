-- Complete Database Setup for Tracverse MLM Platform
-- This script creates all required tables, columns, indexes, and constraints

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Core user management)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    referral_code VARCHAR(12) UNIQUE NOT NULL,
    sponsor_id UUID REFERENCES users(id),
    rank VARCHAR(50) DEFAULT 'Bronze',
    personal_volume DECIMAL(10,2) DEFAULT 0,
    team_volume DECIMAL(10,2) DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    active_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. COMMISSIONS TABLE (Commission tracking)
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'direct', 'binary', 'unilevel', 'matching', 'leadership'
    level INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 3. PAYOUTS TABLE (Payout requests and processing)
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL, -- 'bank_transfer', 'paypal', 'crypto', 'check'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    payment_details JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 4. CLICKS TABLE (URL tracking)
CREATE TABLE IF NOT EXISTS clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    url TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. UTM_CONFIGS TABLE (UTM parameter configurations)
CREATE TABLE IF NOT EXISTS utm_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TASKS TABLE (Exclusive tasks for users)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'one_time'
    reward_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'expired'
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. USER_QUALIFICATIONS TABLE (Rank qualifications tracking)
CREATE TABLE IF NOT EXISTS user_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qualification_type VARCHAR(50) NOT NULL, -- 'personal_volume', 'team_volume', 'direct_referrals'
    required_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'met', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. MARKETING_MATERIALS TABLE (Marketing content library)
CREATE TABLE IF NOT EXISTS marketing_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'image', 'video', 'text', 'template'
    content_url TEXT,
    content_text TEXT,
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tables
DO $$ 
BEGIN
    -- Add password_hash to users if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;

    -- Add total_earnings to users if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_earnings'
    ) THEN
        ALTER TABLE users ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add updated_at to users if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_sponsor_id ON users(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_users_active_status ON users(active_status);

CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_type ON commissions(type);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON payouts(requested_at);

CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);

CREATE INDEX IF NOT EXISTS idx_utm_configs_user_id ON utm_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default ranks if they don't exist
INSERT INTO users (email, referral_code, rank, active_status) 
VALUES ('system@tracverse.com', 'SYSTEM00', 'System', false)
ON CONFLICT (email) DO NOTHING;

-- Update any existing users with missing default values
UPDATE users SET 
    personal_volume = 0 WHERE personal_volume IS NULL;
UPDATE users SET 
    team_volume = 0 WHERE team_volume IS NULL;
UPDATE users SET 
    total_earnings = 0 WHERE total_earnings IS NULL;
UPDATE users SET 
    rank = 'Bronze' WHERE rank IS NULL;
UPDATE users SET 
    active_status = true WHERE active_status IS NULL;

-- Verify setup
SELECT 'SETUP_COMPLETE' as status, 
       COUNT(*) as user_count 
FROM users;

SELECT 'TABLES_CREATED' as status,
       table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'commissions', 'payouts', 'clicks', 'utm_configs', 'tasks', 'user_qualifications', 'marketing_materials')
ORDER BY table_name;
