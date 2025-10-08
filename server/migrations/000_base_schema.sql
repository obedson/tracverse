-- Base Database Schema
-- Migration: 000_base_schema.sql

-- Users table (base structure)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- UTM Configuration table
CREATE TABLE IF NOT EXISTS utm_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utm_source VARCHAR(100) NOT NULL,
    utm_medium VARCHAR(100) NOT NULL,
    utm_campaign_prefix VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Link clicks table (existing structure)
CREATE TABLE IF NOT EXISTS link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    original_url TEXT NOT NULL,
    modified_url TEXT NOT NULL,
    tracking_id VARCHAR(50) NOT NULL,
    platform VARCHAR(50) DEFAULT 'unknown',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_link_clicks_user ON link_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_tracking ON link_clicks(tracking_id);
