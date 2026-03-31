import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

const CORE_FIELDS    = ['display_name', 'full_name', 'assistant_mode', 'email_notifications', 'timezone'];
const PUSH_FIELDS    = ['push_notifications', 'push_reminders', 'push_morning_briefing', 'push_streak_alerts', 'push_goal_reminders', 'push_invoice_alerts'];
const GITHUB_FIELDS  = ['github_token'];

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const s = createAdminSupabaseClient();

  // ── Core fields (always-present columns) ──────────────────────────────────
  const coreUpdates: any = {};
  for (const k of CORE_FIELDS) if (k in body) coreUpdates[k] = body[k];

  if (Object.keys(coreUpdates).length > 0) {
    const { error } = await s.from('profiles').update(coreUpdates).eq('id', user.id);
    if (error) {
      console.error('[profile PATCH] core update error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // ── Push notification preference columns (added in migration 004) ─────────
  // Saved in a separate statement so that if the migration hasn't been applied
  // yet the core profile save above still succeeds.
  const pushUpdates: any = {};
  for (const k of PUSH_FIELDS) if (k in body) pushUpdates[k] = body[k];

  if (Object.keys(pushUpdates).length > 0) {
    const { error } = await s.from('profiles').update(pushUpdates).eq('id', user.id);
    if (error) {
      // Migration likely not applied yet — log but don't fail the whole request.
      console.error('[profile PATCH] push prefs error (run migration 004):', error.message);
    }
  }

  // ── GitHub token (added in migration 008) ────────────────────────────────
  const githubUpdates: any = {};
  for (const k of GITHUB_FIELDS) if (k in body) githubUpdates[k] = body[k];

  if (Object.keys(githubUpdates).length > 0) {
    const { error } = await s.from('profiles').update(githubUpdates).eq('id', user.id);
    if (error) {
      console.error('[profile PATCH] github token error (run migration 008):', error.message);
    }
  }

  // Return updated profile
  const { data: profile } = await s.from('profiles').select('*').eq('id', user.id).single();
  return NextResponse.json({ profile });
}
