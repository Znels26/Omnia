-- ============================================================
-- OMNIA PUSH NOTIFICATION SYSTEM
-- Migration 004 — Push subscriptions, queue, log, preferences
-- ============================================================

-- ── Push subscriptions ─────────────────────────────────────
-- One row per user+device FCM registration token.
-- Tokens are upserted on re-subscribe so we always keep current.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fcm_token   TEXT        NOT NULL,
  device_hint TEXT,                        -- e.g. "Chrome on iPhone"
  created_at  TIMESTAMPTZ DEFAULT now(),
  last_seen   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(user_id);

-- ── Push queue ─────────────────────────────────────────────
-- Cron jobs call queuePush() to insert here.
-- push-dispatcher cron processes this every 15 minutes.
CREATE TABLE IF NOT EXISTS push_queue (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT        NOT NULL,
  priority          SMALLINT    NOT NULL DEFAULT 2,
  -- 1 = urgent   (reminders, invoice_paid) — always sends
  -- 2 = normal   (goal deadlines, streak risk)
  -- 3 = info     (morning briefing) — skipped if daily limit reached
  title             TEXT        NOT NULL,
  body              TEXT        NOT NULL,
  url               TEXT        DEFAULT '/dashboard',
  scheduled_for     TIMESTAMPTZ DEFAULT now(),
  status            TEXT        NOT NULL DEFAULT 'pending',
  -- pending | sent | skipped | combined
  skip_reason       TEXT,
  processed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_queue_status_sched
  ON push_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_push_queue_user
  ON push_queue(user_id);

-- ── Push notification log ──────────────────────────────────
-- Tracks every sent push for anti-spam enforcement.
CREATE TABLE IF NOT EXISTS push_notification_log (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT        NOT NULL,
  sent_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_log_user_sent
  ON push_notification_log(user_id, sent_at DESC);

-- ── Profile preference columns ─────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_notifications    BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_reminders        BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_morning_briefing BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_streak_alerts    BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_goal_reminders   BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_invoice_alerts   BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_push_sent        TIMESTAMPTZ;

-- ── RLS policies ──────────────────────────────────────────
ALTER TABLE push_subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_queue            ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "users_own_push_subs"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Service role bypasses RLS (used by cron jobs via admin client)
-- All other access goes through the admin Supabase client.
