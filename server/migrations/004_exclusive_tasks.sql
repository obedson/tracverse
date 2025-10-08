-- Exclusive tasks table
CREATE TABLE IF NOT EXISTS exclusive_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_reward INTEGER NOT NULL,
    minimum_rank VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample exclusive tasks
INSERT INTO exclusive_tasks (title, description, points_reward, minimum_rank) VALUES
('Silver Survey', 'Complete premium market research survey', 50, 'silver'),
('Gold Partnership Task', 'Promote exclusive brand partnership', 100, 'gold'),
('Platinum Leadership Challenge', 'Lead team building exercise', 200, 'platinum'),
('Diamond Elite Mission', 'VIP client consultation task', 500, 'diamond');

CREATE INDEX IF NOT EXISTS idx_exclusive_tasks_rank ON exclusive_tasks(minimum_rank);
