-- ============================================================
-- OMNIA AUTOPILOT + MEMORY IMPORT SYSTEM
-- Migration 006
-- ============================================================

-- ── User Autopilot Profile ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_autopilot_profile (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  persona               TEXT,       -- hustler | optimiser | builder | creator | learner | operator | starter
  permission_level      SMALLINT    NOT NULL DEFAULT 1, -- 1=draft 2=semi 3=full
  autopilot_enabled     BOOLEAN     NOT NULL DEFAULT false,
  onboarding_complete   BOOLEAN     NOT NULL DEFAULT false,
  onboarding_answers    JSONB       DEFAULT '{}',
  wake_time             TEXT        DEFAULT '07:00',
  timezone              TEXT        DEFAULT 'UTC',
  autopilot_activated_at TIMESTAMPTZ,
  starter_observed_until TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autopilot_profile_user ON user_autopilot_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_enabled ON user_autopilot_profile(autopilot_enabled) WHERE autopilot_enabled = true;

-- ── Autopilot Actions Queue ─────────────────────────────────
CREATE TABLE IF NOT EXISTS autopilot_actions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type   TEXT        NOT NULL, -- content_idea | follow_up | invoice_chase | opportunity | task | goal | briefing
  title         TEXT        NOT NULL,
  description   TEXT,
  payload       JSONB       DEFAULT '{}',
  persona       TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending', -- pending | approved | rejected | done | skipped
  reject_reason TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_autopilot_actions_user_status ON autopilot_actions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_created ON autopilot_actions(created_at DESC);

-- ── Autopilot Log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autopilot_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT        NOT NULL,
  description TEXT        NOT NULL,
  outcome     TEXT,
  reasoning   TEXT,
  persona     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autopilot_log_user ON autopilot_log(user_id, created_at DESC);

-- ── Opportunity Queue ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunity_queue (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  source_url      TEXT,
  relevance_score SMALLINT    DEFAULT 5, -- 1-10
  status          TEXT        NOT NULL DEFAULT 'new', -- new | viewed | acted | dismissed
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_queue_user ON opportunity_queue(user_id, status);

-- ── Imported Conversations ──────────────────────────────────
CREATE TABLE IF NOT EXISTS imported_conversations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform        TEXT        NOT NULL, -- chatgpt | claude | gemini | text
  original_content TEXT,
  category        TEXT,       -- fitness | finance | tasks | goals | content | code | business | learning | personal
  summary         TEXT,
  key_facts       JSONB       DEFAULT '[]',
  goals_extracted JSONB       DEFAULT '[]',
  tasks_extracted JSONB       DEFAULT '[]',
  habits_extracted JSONB      DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imported_conversations_user ON imported_conversations(user_id, category);

-- ── Feature Waitlist ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_waitlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  email       TEXT,
  feature     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature)
);

-- ── Add columns to profiles ─────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_impression_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS persona  TEXT;

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE user_autopilot_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_actions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_queue      ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_waitlist       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_autopilot_profile" ON user_autopilot_profile FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_autopilot_actions" ON autopilot_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_autopilot_log"     ON autopilot_log     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_opportunity_queue" ON opportunity_queue  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_imported_convos"   ON imported_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_feature_waitlist"  ON feature_waitlist  FOR ALL USING (auth.uid() = user_id);
