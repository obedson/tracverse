-- Create PP transactions table for advanced wallet management

CREATE TABLE IF NOT EXISTS pp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- membership_purchase, task_completion, referral_bonus, etc.
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed', -- completed, pending, processing, failed
    description TEXT,
    metadata JSONB, -- Additional transaction data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pp_transactions_user_id ON pp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pp_transactions_category ON pp_transactions(category);
CREATE INDEX IF NOT EXISTS idx_pp_transactions_status ON pp_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pp_transactions_created_at ON pp_transactions(created_at);

-- Insert sample data for testing
INSERT INTO pp_transactions (user_id, category, amount, status, description) VALUES
('00000000-0000-0000-0000-000000000001', 'membership_purchase', 700, 'completed', 'Bronze I Membership Purchase'),
('00000000-0000-0000-0000-000000000001', 'task_completion', 50, 'pending', 'YouTube Subscribe Task Completed'),
('00000000-0000-0000-0000-000000000001', 'referral_bonus', 25, 'pending', 'Referral Commission - Level 1'),
('00000000-0000-0000-0000-000000000001', 'verification_earning', 7, 'completed', 'Task Verification Reward'),
('00000000-0000-0000-0000-000000000001', 'task_promotion', -100, 'completed', 'Instagram Like Campaign')
ON CONFLICT DO NOTHING;
