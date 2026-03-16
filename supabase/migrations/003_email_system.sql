-- ============================================================
-- OMNIA v2 - Email Queue System & Notification Preferences
-- ============================================================

-- Email queue: all outbound user emails go here first.
-- The email-dispatcher cron processes this table with all rules applied.
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  plain_text TEXT,
  category TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, sent, skipped, failed
  skip_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, scheduled_for)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
-- Queued emails are admin-only (service role key); users cannot read/write them

-- ── New profile columns for granular email preferences ─────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_morning_briefing  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_weekly_review     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_finance_alerts    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_fitness_alerts    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_milestone_alerts  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_marketing         BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS preferred_email_time    TEXT    DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS last_email_sent         TIMESTAMPTZ;

-- ── Email unsubscribe log (type-level unsubscribes) ───────────────────────────
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL,        -- 'all' or specific type e.g. 'morning_briefing'
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_email_unsubs_user ON email_unsubscribes(user_id);
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_unsubs_own" ON email_unsubscribes FOR SELECT USING (auth.uid() = user_id);

-- Clean up processed queue entries older than 30 days automatically
-- (run manually or via a cleanup cron)
