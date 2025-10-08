-- Payouts table for payment processing
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    payment_method VARCHAR(20) DEFAULT 'bank_transfer',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processed_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Payment details (encrypted in production)
    payment_details JSONB DEFAULT '{}'::jsonb
);

-- Payout settings per user
CREATE TABLE IF NOT EXISTS payout_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    minimum_threshold DECIMAL(10,2) DEFAULT 50.00,
    payment_method VARCHAR(20) DEFAULT 'bank_transfer',
    payment_details JSONB DEFAULT '{}'::jsonb,
    auto_payout BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_period ON payouts(period);
