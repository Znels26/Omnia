-- ============================================================
-- OMNIA v2 - Clean Schema (no custom ENUMs to avoid type issues)
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Core tables use TEXT instead of ENUMs for maximum compatibility

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  display_name TEXT DEFAULT '',
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  plan_tier TEXT DEFAULT 'free',
  assistant_mode TEXT DEFAULT 'general',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'dark',
  email_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ai_requests_used INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  notes_count INTEGER DEFAULT 0,
  files_count INTEGER DEFAULT 0,
  storage_mb DECIMAL DEFAULT 0,
  tasks_count INTEGER DEFAULT 0,
  reminders_count INTEGER DEFAULT 0,
  content_count INTEGER DEFAULT 0,
  exports_count INTEGER DEFAULT 0,
  invoices_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ DEFAULT date_trunc('month', NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_tier TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Chat',
  mode TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date DATE,
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#0e90e6',
  icon TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily',
  color TEXT DEFAULT '#10b981',
  icon TEXT DEFAULT '⚡',
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  remind_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  recurrence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0e90e6',
  icon TEXT DEFAULT '📁',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  content_preview TEXT,
  word_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  ai_summary TEXT,
  ai_key_points TEXT[],
  processing_status TEXT DEFAULT 'ready',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  platform TEXT,
  tone TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input_content TEXT,
  storage_url TEXT,
  file_size_bytes INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_company TEXT,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_company TEXT,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft',
  currency TEXT DEFAULT 'USD',
  subtotal_cents INTEGER DEFAULT 0,
  tax_rate DECIMAL DEFAULT 0,
  tax_amount_cents INTEGER DEFAULT 0,
  total_cents INTEGER DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL DEFAULT 1,
  unit_price_cents INTEGER DEFAULT 0,
  total_cents INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS key TEXT;
UPDATE feature_flags SET key = id::TEXT WHERE key IS NULL;
ALTER TABLE feature_flags ALTER COLUMN key SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feature_flags_key_key' AND conrelid = 'feature_flags'::regclass
  ) THEN
    ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_key_key UNIQUE (key);
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_content_user ON content_items(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_user ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_select" ON profiles;
  DROP POLICY IF EXISTS "profiles_insert" ON profiles;
  DROP POLICY IF EXISTS "profiles_update" ON profiles;
  DROP POLICY IF EXISTS "usage_select" ON usage_counters;
  DROP POLICY IF EXISTS "subs_select" ON subscriptions;
  DROP POLICY IF EXISTS "chats_all" ON chats;
  DROP POLICY IF EXISTS "messages_all" ON chat_messages;
  DROP POLICY IF EXISTS "tasks_all" ON tasks;
  DROP POLICY IF EXISTS "goals_all" ON goals;
  DROP POLICY IF EXISTS "habits_all" ON habits;
  DROP POLICY IF EXISTS "reminders_all" ON reminders;
  DROP POLICY IF EXISTS "folders_all" ON note_folders;
  DROP POLICY IF EXISTS "notes_all" ON notes;
  DROP POLICY IF EXISTS "files_all" ON files;
  DROP POLICY IF EXISTS "content_all" ON content_items;
  DROP POLICY IF EXISTS "exports_all" ON exports;
  DROP POLICY IF EXISTS "invoices_all" ON invoices;
  DROP POLICY IF EXISTS "invoice_items_all" ON invoice_items;
  DROP POLICY IF EXISTS "notifs_all" ON notifications;
  DROP POLICY IF EXISTS "flags_read" ON feature_flags;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "usage_select" ON usage_counters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subs_select" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chats_all" ON chats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "messages_all" ON chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "goals_all" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "habits_all" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reminders_all" ON reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "folders_all" ON note_folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notes_all" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "files_all" ON files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "content_all" ON content_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "exports_all" ON exports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "invoices_all" ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "invoice_items_all" ON invoice_items FOR ALL USING (
  invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
);
CREATE POLICY "notifs_all" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "flags_read" ON feature_flags FOR SELECT USING (true);

-- ============================================================
-- TRIGGER: Auto-create profile on signup (TEXT types, no enums)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.usage_counters (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan_tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FEATURE FLAGS SEED DATA
-- ============================================================
INSERT INTO feature_flags (key, name, is_enabled) VALUES
  ('ai_streaming', 'AI Streaming', true),
  ('document_builder', 'Document Builder', true),
  ('invoice_generation', 'Invoice Generation', true),
  ('content_studio', 'Content Studio', true)
ON CONFLICT (key) DO NOTHING;
