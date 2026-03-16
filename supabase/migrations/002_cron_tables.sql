-- ============================================================
-- OMNIA v2 - Cron Job Support Tables
-- ============================================================

-- Tracks once-per-user email sends (testimonial, NPS, etc.)
CREATE TABLE IF NOT EXISTS cron_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

-- User login/activity streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  login_streak INTEGER DEFAULT 0,
  login_streak_best INTEGER DEFAULT 0,
  last_login_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abuse flags for security monitoring
CREATE TABLE IF NOT EXISTS abuse_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  api_calls INTEGER DEFAULT 0,
  flagged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral codes and conversions
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_email TEXT,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- Promo/discount codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin metrics store
CREATE TABLE IF NOT EXISTS admin_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature usage analytics (aggregated, not per-user)
CREATE TABLE IF NOT EXISTS feature_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  event_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  recorded_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(feature_name, recorded_date)
);

-- RLS
ALTER TABLE cron_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cron_email_log_own" ON cron_email_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_streaks_own" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "referrals_own" ON referrals FOR ALL USING (auth.uid() = referrer_id);
CREATE POLICY "promo_codes_read" ON promo_codes FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cron_email_log_user ON cron_email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_flags_user ON abuse_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_key ON admin_metrics(metric_key);
