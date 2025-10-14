-- Add PP columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_pp DECIMAL(15,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_pp DECIMAL(15,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_pp DECIMAL(15,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS purchased_pp DECIMAL(15,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS earned_pp DECIMAL(15,2) DEFAULT 0;

-- Add test PP data to existing user
UPDATE users 
SET 
    total_pp = 5000.00,
    available_pp = 3000.00,
    pending_pp = 2000.00,
    purchased_pp = 3000.00,
    earned_pp = 2000.00
WHERE id = (SELECT id FROM users LIMIT 1);
