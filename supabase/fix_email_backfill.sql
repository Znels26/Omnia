-- Backfill missing profile emails from auth.users
-- Run once in Supabase SQL editor
UPDATE profiles
SET email = auth_users.email
FROM auth.users AS auth_users
WHERE auth_users.id = profiles.id
  AND (profiles.email IS NULL OR profiles.email = '');
