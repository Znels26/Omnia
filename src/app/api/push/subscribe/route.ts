import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/push/subscribe
 * Saves or refreshes a user's FCM registration token.
 * Called by NotificationPrompt after the user grants permission.
 *
 * Body: { token: string, deviceHint?: string }
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token, deviceHint } = await req.json().catch(() => ({}));
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  const s = createAdminSupabaseClient();

  // Upsert on the unique fcm_token column.
  // If this token already exists for another user (device switch), update to the new user.
  const { error } = await s.from('push_subscriptions').upsert(
    {
      user_id:     user.id,
      fcm_token:   token,
      device_hint: deviceHint ?? null,
      last_seen:   new Date().toISOString(),
    },
    { onConflict: 'fcm_token' }
  );

  if (error) {
    console.error('[push/subscribe] upsert error:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/push/subscribe
 * Removes a specific FCM token (user unsubscribing from this device).
 * Body: { token: string }
 */
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const s = createAdminSupabaseClient();
  await s.from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('fcm_token', token);

  return NextResponse.json({ ok: true });
}
