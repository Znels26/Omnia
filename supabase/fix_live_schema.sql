-- ============================================================
-- FIX: Add ALL missing columns to profiles + backfill data
-- Copy from GitHub Raw and paste into Supabase SQL Editor
-- ============================================================

-- STEP 1: Add every column that may be missing from profiles
-- (ADD COLUMN IF NOT EXISTS is safe to run multiple times)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assistant_mode TEXT DEFAULT 'general';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- From migration 003 (email system)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_morning_briefing BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_weekly_review BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_finance_alerts BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_fitness_alerts BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_milestone_alerts BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_email_time TEXT DEFAULT '07:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMPTZ;

-- From migration 004 (push notifications)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_reminders BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_morning_briefing BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_streak_alerts BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_goal_reminders BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_invoice_alerts BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_push_sent TIMESTAMPTZ;

-- From migration 006 (autopilot)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_impression_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS persona TEXT;

-- STEP 2: Backfill email from auth.users
UPDATE profiles
SET email = u.email
FROM auth.users u
WHERE u.id = profiles.id
  AND (profiles.email IS NULL OR profiles.email = '');

-- STEP 3: Backfill full_name and display_name
UPDATE profiles
SET
  full_name = COALESCE(u.raw_user_meta_data->>'full_name', ''),
  display_name = COALESCE(
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1)
  )
FROM auth.users u
WHERE u.id = profiles.id
  AND (profiles.full_name IS NULL OR profiles.full_name = '')
  AND (profiles.display_name IS NULL OR profiles.display_name = '');

-- STEP 4: Backfill missing profile rows entirely
INSERT INTO profiles (id, email, full_name, display_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles);

-- STEP 5: Backfill missing usage_counters rows
INSERT INTO usage_counters (user_id)
SELECT u.id FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM usage_counters);

-- STEP 6: Backfill missing subscriptions rows
INSERT INTO subscriptions (user_id, plan_tier, status)
SELECT u.id, 'free', 'active' FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM subscriptions);

-- STEP 7: Fix feature_flags missing columns
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS value BOOLEAN DEFAULT true;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
