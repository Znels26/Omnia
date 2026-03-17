-- ============================================================
-- OMNIA PAGE VIEW ANALYTICS
-- Migration 005 — lightweight first-party view tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS page_views (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page       TEXT        NOT NULL,              -- normalised path, e.g. '/pricing'
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT        NOT NULL,              -- random UUID stored in sessionStorage
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deduplication check (same session + page within 30 min)
CREATE INDEX IF NOT EXISTS idx_pv_session_page_ts
  ON page_views(session_id, page, created_at DESC);

-- Admin queries: views by day, top pages
CREATE INDEX IF NOT EXISTS idx_pv_created
  ON page_views(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pv_page
  ON page_views(page);

-- RLS: only the service role (admin client) reads; inserts are open (anonymous visitors)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (public tracking)
CREATE POLICY "anyone_can_insert_views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Only service role can select (enforced by admin client in crons/API)
