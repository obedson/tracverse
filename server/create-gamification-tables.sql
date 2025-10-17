-- Create gamification system tables

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- tasks, referrals, verification, earnings, streaks
    icon VARCHAR(10) NOT NULL,
    target INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Add gamification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Insert default achievements
INSERT INTO achievements (title, description, category, icon, target, xp_reward) VALUES
('First Steps', 'Complete your first task', 'tasks', '🎯', 1, 100),
('Getting Started', 'Complete 10 tasks', 'tasks', '✅', 10, 200),
('Task Warrior', 'Complete 50 tasks', 'tasks', '⚔️', 50, 500),
('Task Master', 'Complete 100 tasks', 'tasks', '🏆', 100, 1000),
('Task Legend', 'Complete 500 tasks', 'tasks', '👑', 500, 2500),

('First Referral', 'Refer your first user', 'referrals', '👥', 1, 150),
('Team Builder', 'Refer 5 users', 'referrals', '🏗️', 5, 300),
('Referral Pro', 'Refer 25 users', 'referrals', '🚀', 25, 750),
('Referral Champion', 'Refer 100 users', 'referrals', '👑', 100, 2000),

('First Verification', 'Complete your first verification', 'verification', '🔍', 1, 75),
('Verification Expert', 'Complete 50 verifications', 'verification', '🎖️', 50, 400),
('Quality Guardian', 'Complete 200 verifications', 'verification', '🛡️', 200, 1000),

('First Earnings', 'Earn your first 1,000 PP', 'earnings', '💰', 1000, 100),
('PP Collector', 'Earn 10,000 PP total', 'earnings', '💎', 10000, 500),
('PP Millionaire', 'Earn 1,000,000 PP total', 'earnings', '🏆', 1000000, 5000),

('Streak Starter', 'Maintain a 3-day activity streak', 'streaks', '🔥', 3, 150),
('Streak Warrior', 'Maintain a 7-day activity streak', 'streaks', '⚡', 7, 300),
('Streak Master', 'Maintain a 30-day activity streak', 'streaks', '🌟', 30, 1000)
ON CONFLICT DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp);
