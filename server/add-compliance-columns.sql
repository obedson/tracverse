-- Add compliance columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cooling_off_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_earn_commissions BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending';

-- Update existing users to have proper compliance status
UPDATE users SET 
  can_earn_commissions = true,
  kyc_status = 'pending'
WHERE can_earn_commissions IS NULL OR kyc_status IS NULL;
