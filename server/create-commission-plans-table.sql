-- Commission Plans Configuration Table
CREATE TABLE IF NOT EXISTS commission_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_tier VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL, -- 0.0500 for 5%
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(membership_tier, level)
);

-- Insert default commission structure
INSERT INTO commission_plans (membership_tier, level, commission_rate) VALUES
-- Bronze tier (4 levels)
('Bronze', 1, 0.0500), -- 5%
('Bronze', 2, 0.0300), -- 3%
('Bronze', 3, 0.0200), -- 2%
('Bronze', 4, 0.0100), -- 1%

-- Silver tier (5 levels)
('Silver', 1, 0.0600), -- 6%
('Silver', 2, 0.0400), -- 4%
('Silver', 3, 0.0300), -- 3%
('Silver', 4, 0.0200), -- 2%
('Silver', 5, 0.0100), -- 1%

-- Gold tier (6 levels)
('Gold', 1, 0.0700), -- 7%
('Gold', 2, 0.0500), -- 5%
('Gold', 3, 0.0400), -- 4%
('Gold', 4, 0.0300), -- 3%
('Gold', 5, 0.0200), -- 2%
('Gold', 6, 0.0100); -- 1%
