-- Analyze current database state to understand what exists vs what's needed

-- 1. Check all existing tables
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check detailed schema for key tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'commissions', 'payouts', 'clicks', 'utm_configs', 'tasks', 'marketing_materials')
ORDER BY table_name, ordinal_position;

-- 3. Check existing indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5. Check current data counts
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
    'commissions' as table_name, COUNT(*) as row_count FROM commissions
UNION ALL
SELECT 
    'payouts' as table_name, COUNT(*) as row_count FROM payouts
UNION ALL
SELECT 
    'clicks' as table_name, COUNT(*) as row_count FROM clicks
UNION ALL
SELECT 
    'utm_configs' as table_name, COUNT(*) as row_count FROM utm_configs
UNION ALL
SELECT 
    'tasks' as table_name, COUNT(*) as row_count FROM tasks;

-- 6. Check if referral analytics tables exist (these are missing)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_analytics') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as referral_analytics_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_qr_codes') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as referral_qr_codes_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'utm_tracking') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as utm_tracking_status;
