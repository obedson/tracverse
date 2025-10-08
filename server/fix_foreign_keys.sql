-- Fix foreign key constraints to work with Supabase Auth
-- Run this in Supabase SQL Editor

-- Drop existing foreign key constraints
ALTER TABLE public.commissions DROP CONSTRAINT IF EXISTS commissions_user_id_fkey;
ALTER TABLE public.payouts DROP CONSTRAINT IF EXISTS payouts_user_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE public.utm_configs DROP CONSTRAINT IF EXISTS utm_configs_user_id_fkey;

-- Make user_id reference auth.users instead of public.users
ALTER TABLE public.commissions ADD CONSTRAINT commissions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.payouts ADD CONSTRAINT payouts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.tasks ADD CONSTRAINT tasks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.utm_configs ADD CONSTRAINT utm_configs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);
