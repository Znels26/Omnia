-- ============================================================
-- FIX: Backfill missing profiles/usage/subscriptions rows
-- and create page_views table if missing.
-- Open this file in VS Code and paste from there into Supabase.
-- ============================================================

-- Step 1: Create profiles for any auth users that don't have one
INSERT INTO profiles (id, email, full_name, display_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles);

-- Step 2: Create usage_counters rows for any users missing one
INSERT INTO usage_counters (user_id)
SELECT u.id FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM usage_counters);

-- Step 3: Create subscriptions rows for any users missing one
INSERT INTO subscriptions (user_id, plan_tier, status)
SELECT u.id, 'free', 'active' FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM subscriptions);

-- Step 4: Create page_views table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS page_views (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page       TEXT        NOT NULL,
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pv_session_page_ts ON page_views(session_id, page, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_page ON page_views(page);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_can_insert_views" ON page_views;
CREATE POLICY "anyone_can_insert_views" ON page_views FOR INSERT WITH CHECK (true);
