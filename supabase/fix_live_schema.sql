-- ============================================================
-- FIX: Sync live Supabase DB to match migration schema
-- Run this in Supabase SQL Editor (copy from GitHub raw URL)
-- ============================================================

-- 1. Add email column to profiles (missing if table predates migration)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill emails from auth.users
UPDATE profiles
SET email = auth_users.email
FROM auth.users AS auth_users
WHERE auth_users.id = profiles.id
  AND (profiles.email IS NULL OR profiles.email = '');

-- 3. Enforce NOT NULL now that all rows are populated
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- 4. Fix feature_flags table (add missing columns if predates migration)
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS value BOOLEAN DEFAULT true;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 5. Backfill any missing profile rows for existing auth users
INSERT INTO profiles (id, email, full_name, display_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles);

-- 6. Backfill missing usage_counters rows
INSERT INTO usage_counters (user_id)
SELECT u.id FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM usage_counters);

-- 7. Backfill missing subscriptions rows
INSERT INTO subscriptions (user_id, plan_tier, status)
SELECT u.id, 'free', 'active' FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM subscriptions);
