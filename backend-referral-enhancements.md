# Backend Enhancements for Referral Code Features

## ANALYSIS: Current vs Required Backend Features

### ✅ ALREADY IMPLEMENTED (from existing schema):
- Users table with referral_code field
- Sponsor_id relationships
- Commissions tracking
- Payouts system
- Basic MLM structure

### ❌ MISSING CRITICAL FEATURES for Frontend Referral Code Requirements:

## 1. REFERRAL TRACKING & ANALYTICS TABLES

```sql
-- Referral link clicks and conversions
CREATE TABLE referral_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    click_source VARCHAR(100), -- 'social', 'email', 'qr', 'direct'
    ip_address INET,
    user_agent TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    converted BOOLEAN DEFAULT FALSE,
    converted_user_id UUID REFERENCES auth.users(id),
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_at TIMESTAMP WITH TIME ZONE
);

-- UTM parameter tracking
CREATE TABLE utm_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code VARCHAR(50) NOT NULL,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. REFERRAL CODE MANAGEMENT ENHANCEMENTS

```sql
-- Add indexes for performance
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_referral_analytics_code ON referral_analytics(referral_code);
CREATE INDEX idx_referral_analytics_user ON referral_analytics(user_id);

-- Referral code uniqueness constraint
ALTER TABLE users ADD CONSTRAINT unique_referral_code UNIQUE (referral_code);

-- Referral code generation function enhancement
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := 'REF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 7));
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

## 3. QR CODE STORAGE

```sql
-- QR code storage for referral codes
CREATE TABLE referral_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    referral_code VARCHAR(50) NOT NULL,
    qr_code_url TEXT, -- URL to stored QR code image
    qr_code_data TEXT, -- Base64 encoded QR code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. REFERRAL CONVERSION TRACKING

```sql
-- Enhanced user registration with referral tracking
ALTER TABLE users ADD COLUMN referred_by_code VARCHAR(50);
ALTER TABLE users ADD COLUMN referral_source VARCHAR(100); -- 'qr', 'social', 'email', 'direct'
ALTER TABLE users ADD COLUMN conversion_date TIMESTAMP WITH TIME ZONE;

-- Referral conversion stats view
CREATE VIEW referral_conversion_stats AS
SELECT 
    u.referral_code,
    u.id as referrer_id,
    COUNT(referred.id) as total_referrals,
    COUNT(CASE WHEN referred.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as referrals_last_30_days,
    COUNT(CASE WHEN referred.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as referrals_last_7_days,
    ra.total_clicks,
    CASE 
        WHEN ra.total_clicks > 0 THEN (COUNT(referred.id)::FLOAT / ra.total_clicks * 100)
        ELSE 0 
    END as conversion_rate
FROM users u
LEFT JOIN users referred ON referred.referred_by_code = u.referral_code
LEFT JOIN (
    SELECT referral_code, COUNT(*) as total_clicks
    FROM referral_analytics 
    GROUP BY referral_code
) ra ON ra.referral_code = u.referral_code
GROUP BY u.id, u.referral_code, ra.total_clicks;
```

## 5. API ENDPOINTS TO ADD

```javascript
// Referral Analytics Endpoints
GET /api/referrals/analytics/:userId
GET /api/referrals/stats/:referralCode
POST /api/referrals/track-click
POST /api/referrals/generate-qr
GET /api/referrals/conversion-stats/:userId

// UTM Tracking Endpoints  
POST /api/utm/track
GET /api/utm/campaigns/:userId
PUT /api/utm/campaign/:id

// Referral Link Management
POST /api/referrals/generate-link
GET /api/referrals/links/:userId
PUT /api/referrals/link/:id
DELETE /api/referrals/link/:id
```

## 6. ENHANCED TRIGGER FUNCTIONS

```sql
-- Enhanced user creation trigger with referral tracking
CREATE OR REPLACE FUNCTION create_custom_user_with_referral()
RETURNS TRIGGER AS $$
DECLARE
    referring_user_id UUID;
    new_referral_code VARCHAR(10);
BEGIN
    -- Generate unique referral code
    new_referral_code := generate_unique_referral_code();
    
    -- Find referring user if referral code provided
    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        SELECT id INTO referring_user_id 
        FROM users 
        WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
        
        -- Update referral analytics
        UPDATE referral_analytics 
        SET converted = TRUE, 
            converted_user_id = NEW.id,
            converted_at = NOW()
        WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
        AND converted = FALSE;
    END IF;
    
    -- Create custom user record
    INSERT INTO public.users (
        user_id, email, referral_code, sponsor_id, 
        referred_by_code, referral_source, conversion_date,
        rank, personal_volume, team_volume, total_earnings, active_status
    ) VALUES (
        NEW.id, NEW.email, new_referral_code, referring_user_id,
        NEW.raw_user_meta_data->>'referral_code',
        NEW.raw_user_meta_data->>'referral_source',
        CASE WHEN referring_user_id IS NOT NULL THEN NOW() ELSE NULL END,
        'Bronze', 0, 0, 0, true
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. PERFORMANCE OPTIMIZATIONS

```sql
-- Indexes for referral analytics
CREATE INDEX idx_referral_analytics_clicked_at ON referral_analytics(clicked_at);
CREATE INDEX idx_referral_analytics_converted ON referral_analytics(converted);
CREATE INDEX idx_referral_analytics_source ON referral_analytics(click_source);

-- Materialized view for referral stats (refresh periodically)
CREATE MATERIALIZED VIEW mv_referral_stats AS
SELECT * FROM referral_conversion_stats;

CREATE UNIQUE INDEX idx_mv_referral_stats_user ON mv_referral_stats(referrer_id);
```

## 8. SECURITY ENHANCEMENTS

```sql
-- Row Level Security for referral data
ALTER TABLE referral_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_qr_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own referral analytics
CREATE POLICY referral_analytics_policy ON referral_analytics
    FOR ALL USING (
        user_id = auth.uid() OR 
        user_id IN (SELECT id FROM users WHERE referral_code IN (
            SELECT referral_code FROM users WHERE user_id = auth.uid()::text
        ))
    );
```

## IMPLEMENTATION PRIORITY:

**Phase 1 (Critical - Week 1):**
- Referral analytics table
- UTM tracking table  
- Enhanced trigger function
- Basic API endpoints

**Phase 2 (High - Week 2):**
- QR code storage
- Conversion tracking enhancements
- Performance indexes
- Security policies

**Phase 3 (Medium - Week 3):**
- Materialized views
- Advanced analytics endpoints
- Referral link management
- Campaign tracking

This backend enhancement ensures full support for all frontend referral code features while maintaining performance and security standards.
