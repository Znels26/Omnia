-- ============================================================
-- FIX: Recreate feature_flags table with correct schema
-- The table may exist without the required `key` column.
-- Safe to run multiple times (idempotent).
-- Paste this directly into Supabase SQL editor and run it.
-- ============================================================

-- Drop and recreate cleanly (table only holds seed data, no user data)
DROP TABLE IF EXISTS feature_flags;

CREATE TABLE feature_flags (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT    UNIQUE NOT NULL,
  name       TEXT    NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flags_read" ON feature_flags;
CREATE POLICY "flags_read" ON feature_flags FOR SELECT USING (true);

-- Seed data
INSERT INTO feature_flags (key, name, is_enabled) VALUES
  ('ai_streaming',       'AI Streaming',       true),
  ('document_builder',   'Document Builder',   true),
  ('invoice_generation', 'Invoice Generation', true),
  ('content_studio',     'Content Studio',     true)
ON CONFLICT (key) DO NOTHING;
