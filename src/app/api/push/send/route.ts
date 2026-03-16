import { NextRequest, NextResponse } from 'next/server';
import { sendFcmMessage } from '@/lib/push-scheduler';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/push/send
 * Sends a push notification immediately via FCM V1 API.
 * Bypasses the queue — for urgent sends (invoice paid, etc.).
 *
 * Auth: Bearer CRON_SECRET header required.
 *
 * Body:
 *   { userId: string, title: string, body: string, url?: string }
 *
 * Fetches all FCM tokens for the user and fans out to each device.
 * Dead tokens (UNREGISTERED) are automatically pruned from the DB.
 */
export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.title || !body?.body) {
    return NextResponse.json({ error: 'userId, title, body required' }, { status: 400 });
  }

  const { userId, title, body: msgBody, url = '/dashboard' } = body;
  const s = createAdminSupabaseClient();

  // Fetch user's active FCM tokens
  const { data: subs } = await s
    .from('push_subscriptions')
    .select('id, fcm_token')
    .eq('user_id', userId);

  if (!subs?.length) {
    return NextResponse.json({ sent: 0, reason: 'no_subscriptions' });
  }

  let sent = 0;
  const deadIds: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub: any) => {
      const result = await sendFcmMessage(sub.fcm_token, title, msgBody, url);
      if (result === 'ok') {
        sent++;
        await s.from('push_subscriptions')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', sub.id);
      } else if (result === 'invalid_token') {
        deadIds.push(sub.id);
      }
    })
  );

  // Prune dead tokens
  if (deadIds.length) {
    await s.from('push_subscriptions').delete().in('id', deadIds);
  }

  if (sent > 0) {
    // Log and update last_push_sent
    await s.from('push_notification_log').insert({
      user_id:           userId,
      notification_type: 'direct_send',
      sent_at:           new Date().toISOString(),
    });
    await s.from('profiles')
      .update({ last_push_sent: new Date().toISOString() })
      .eq('id', userId);
  }

  return NextResponse.json({ sent, devices: subs.length, deadPruned: deadIds.length });
}
