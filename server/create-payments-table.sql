-- Create payments table for membership purchases
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    plan_id INTEGER NOT NULL,
    pp_allocated INTEGER NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'paystack',
    paystack_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Create PP transactions table if not exists
CREATE TABLE IF NOT EXISTS pp_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    release_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for PP transactions
CREATE INDEX IF NOT EXISTS idx_pp_transactions_user_id ON pp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pp_transactions_type ON pp_transactions(type);
CREATE INDEX IF NOT EXISTS idx_pp_transactions_status ON pp_transactions(status);

-- Add membership_tier column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_tier INTEGER DEFAULT 1;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
