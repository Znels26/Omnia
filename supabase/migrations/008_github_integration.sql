-- ============================================================
-- GITHUB INTEGRATION
-- Store encrypted GitHub Personal Access Token on profile
-- ============================================================

alter table public.profiles
  add column if not exists github_token text;
