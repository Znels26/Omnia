/**
 * OMNIA PUSH NOTIFICATION SCHEDULER
 * ===================================
 * Central rules engine for all user-facing push notifications.
 * Mirrors the email-scheduler.ts pattern exactly.
 *
 * Anti-spam rules enforced:
 *  - Max 3 push notifications per user per day
 *  - Never between 10pm–7am in user's local timezone
 *  - Minimum 2-hour gap between any two pushes per user
 *  - Priority 1 (reminders, invoice alerts) always sends
 *  - Priority 2 (goal deadlines, streak risk) sends if limit not reached
 *  - Priority 3 (morning briefing) skipped when limit is reached
 *  - Multiple notifications within 5-minute window are combined into one
 *  - Per-type toggles respected (push_morning_briefing, etc.)
 *  - Global push_notifications toggle respected
 *
 * Usage in cron jobs:
 *   import { queuePush } from '@/lib/push-scheduler';
 *   await queuePush({ userId, type: 'reminder', priority: 1, title, body, url });
 *
 * push-dispatcher cron calls dispatchPushes() every 15 minutes.
 */

import { createSign } from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PushPriority = 1 | 2 | 3;

export interface QueuePushParams {
  userId:       string;
  type:         string;
  priority:     PushPriority;
  title:        string;
  body:         string;
  url?:         string;
  scheduledFor?: Date;
}

export interface DispatchResult {
  sent:     number;
  skipped:  number;
  combined: number;
}

// ── Preference field mapping ───────────────────────────────────────────────────
// Maps notification_type → profile column.
const PREF_MAP: Record<string, string> = {
  morning_briefing: 'push_morning_briefing',
  streak_at_risk:   'push_streak_alerts',
  goal_deadline:    'push_goal_reminders',
  reminder:         'push_reminders',
  invoice_paid:     'push_invoice_alerts',
};

// Priority-1 types that always send (bypass daily/gap limits, still respect quiet hours)
const URGENT_TYPES = new Set(['reminder', 'invoice_paid']);

// Max pushes per day (non-urgent)
const DAILY_LIMIT = 3;

// Minimum gap between pushes in milliseconds (2 hours)
const MIN_GAP_MS = 2 * 60 * 60 * 1000;

// Window for combining simultaneous notifications (5 minutes)
const COMBINE_WINDOW_MS = 5 * 60 * 1000;

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Add a push notification to the queue.
 * Call this from cron jobs — the dispatcher will process it with rules applied.
 */
export async function queuePush(params: QueuePushParams): Promise<void> {
  const s = createAdminSupabaseClient();
  await s.from('push_queue').insert({
    user_id:           params.userId,
    notification_type: params.type,
    priority:          params.priority,
    title:             params.title.slice(0, 100),
    body:              params.body.slice(0, 200),
    url:               params.url ?? '/dashboard',
    scheduled_for:     (params.scheduledFor ?? new Date()).toISOString(),
    status:            'pending',
  });
}

/**
 * Process all pending push notifications from the queue.
 * Called by the push-dispatcher cron every 15 minutes.
 */
export async function dispatchPushes(): Promise<DispatchResult> {
  const s = createAdminSupabaseClient();
  const now = new Date().toISOString();

  const { data: pending } = await s
    .from('push_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (!pending?.length) return { sent: 0, skipped: 0, combined: 0 };

  // Group by user
  const byUser: Record<string, any[]> = {};
  for (const n of pending) {
    byUser[n.user_id] ??= [];
    byUser[n.user_id].push(n);
  }

  let sent = 0, skipped = 0, combined = 0;

  for (const [userId, notifications] of Object.entries(byUser)) {
    const r = await processUserPushes(s, userId, notifications);
    sent     += r.sent;
    skipped  += r.skipped;
    combined += r.combined;
  }

  return { sent, skipped, combined };
}

/**
 * Send a push notification immediately, bypassing the queue.
 * For urgent server-side sends (e.g. invoice paid webhook).
 */
export async function sendPushNow(
  userId: string,
  title:  string,
  body:   string,
  url:    string = '/dashboard'
): Promise<boolean> {
  const s = createAdminSupabaseClient();
  const { data: subs } = await s
    .from('push_subscriptions')
    .select('fcm_token')
    .eq('user_id', userId);

  if (!subs?.length) return false;

  let anySent = false;
  await Promise.allSettled(
    subs.map(async (sub) => {
      const ok = await sendFcmMessage(sub.fcm_token, title, body, url);
      if (ok) anySent = true;
    })
  );

  if (anySent) {
    await s.from('push_notification_log').insert({
      user_id: userId,
      notification_type: 'direct',
      sent_at: new Date().toISOString(),
    });
    await s.from('profiles')
      .update({ last_push_sent: new Date().toISOString() })
      .eq('id', userId);
  }
  return anySent;
}

// ── Per-user processing ────────────────────────────────────────────────────────

async function processUserPushes(
  s:             any,
  userId:        string,
  notifications: any[]
): Promise<DispatchResult> {
  let sent = 0, skipped = 0, combined = 0;

  // Check user has at least one push subscription
  const { count: subCount } = await s
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (!subCount) {
    await markAll(s, notifications, 'skipped', 'no_subscription');
    return { sent: 0, skipped: notifications.length, combined: 0 };
  }

  // Load profile with all preference fields
  const { data: profile } = await s
    .from('profiles')
    .select([
      'id', 'timezone', 'last_push_sent',
      'push_notifications',
      'push_reminders', 'push_morning_briefing',
      'push_streak_alerts', 'push_goal_reminders', 'push_invoice_alerts',
    ].join(', '))
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    await markAll(s, notifications, 'skipped', 'no_profile');
    return { sent: 0, skipped: notifications.length, combined: 0 };
  }

  // Separate urgent (P1) from non-urgent
  const urgent    = notifications.filter(n => URGENT_TYPES.has(n.notification_type));
  const nonUrgent = notifications.filter(n => !URGENT_TYPES.has(n.notification_type));

  // ── Process urgent notifications ──────────────────────────────────────────
  for (const n of urgent) {
    // Check individual preference
    const prefField = PREF_MAP[n.notification_type];
    if (prefField && profile[prefField] === false) {
      await markNotif(s, n.id, 'skipped', 'user_preference');
      skipped++;
      continue;
    }

    // Quiet hours (10pm–7am) — reschedule urgents too (reminders are time-sensitive but respectful)
    if (isInQuietHours(profile.timezone)) {
      const reschedule = getNextSevenAm(profile.timezone);
      await s.from('push_queue').update({ scheduled_for: reschedule.toISOString() }).eq('id', n.id);
      continue;
    }

    const ok = await deliverToUser(s, userId, n.title, n.body, n.url);
    if (ok) {
      await markNotif(s, n.id, 'sent', null);
      await logPushSent(s, userId, n.notification_type);
      sent++;
    } else {
      await markNotif(s, n.id, 'skipped', 'delivery_failed');
      skipped++;
    }
  }

  // ── Process non-urgent notifications ──────────────────────────────────────
  if (!nonUrgent.length) return { sent, skipped, combined };

  // Global push opt-out
  if (!profile.push_notifications) {
    await markAll(s, nonUrgent, 'skipped', 'notifications_off');
    return { sent, skipped: skipped + nonUrgent.length, combined };
  }

  // Quiet hours — reschedule to next 7am
  if (isInQuietHours(profile.timezone)) {
    const reschedule = getNextSevenAm(profile.timezone);
    for (const n of nonUrgent) {
      await s.from('push_queue').update({ scheduled_for: reschedule.toISOString() }).eq('id', n.id);
    }
    return { sent, skipped, combined };
  }

  // 2-hour gap since last push
  if (profile.last_push_sent) {
    const msSince = Date.now() - new Date(profile.last_push_sent).getTime();
    if (msSince < MIN_GAP_MS) {
      const reschedule = new Date(new Date(profile.last_push_sent).getTime() + MIN_GAP_MS);
      for (const n of nonUrgent) {
        await s.from('push_queue').update({ scheduled_for: reschedule.toISOString() }).eq('id', n.id);
      }
      return { sent, skipped, combined };
    }
  }

  // Daily limit: max 3 per day
  const todayStart = getTodayStart(profile.timezone);
  const { count: todaySent } = await s
    .from('push_notification_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', todayStart.toISOString());

  if ((todaySent ?? 0) >= DAILY_LIMIT) {
    await markAll(s, nonUrgent, 'skipped', 'daily_limit');
    return { sent, skipped: skipped + nonUrgent.length, combined };
  }

  const remaining = DAILY_LIMIT - (todaySent ?? 0);

  // Filter by individual preference
  const allowed:  any[] = [];
  const blocked:  any[] = [];

  for (const n of nonUrgent) {
    const prefField = PREF_MAP[n.notification_type];
    if (prefField && profile[prefField] === false) {
      blocked.push(n);
    } else {
      allowed.push(n);
    }
  }

  if (blocked.length) {
    await markAll(s, blocked, 'skipped', 'user_preference');
    skipped += blocked.length;
  }

  if (!allowed.length) return { sent, skipped, combined };

  // Combine notifications that are scheduled within 5 minutes of each other
  const toProcess = combineNotifications(allowed.slice(0, remaining));
  const overflow  = allowed.slice(remaining);

  if (overflow.length) {
    await markAll(s, overflow, 'skipped', 'daily_limit');
    skipped += overflow.length;
  }

  for (const item of toProcess) {
    if (item.combined) {
      // item.combined is an array of queue row ids
      const ok = await deliverToUser(s, userId, item.title, item.body, item.url);
      if (ok) {
        await markAll(s, item.sourceRows, 'combined', null);
        await logPushSent(s, userId, 'combined');
        combined += item.sourceRows.length;
        sent++;
      } else {
        await markAll(s, item.sourceRows, 'skipped', 'delivery_failed');
        skipped += item.sourceRows.length;
      }
    } else {
      const ok = await deliverToUser(s, userId, item.title, item.body, item.url);
      if (ok) {
        await markNotif(s, item.id, 'sent', null);
        await logPushSent(s, userId, item.notification_type);
        sent++;
      } else {
        await markNotif(s, item.id, 'skipped', 'delivery_failed');
        skipped++;
      }
    }
  }

  return { sent, skipped, combined };
}

// ── Combine notifications ──────────────────────────────────────────────────────

function combineNotifications(rows: any[]): any[] {
  if (rows.length <= 1) return rows;

  // Group rows that arrive within COMBINE_WINDOW_MS of the earliest
  const earliest = new Date(rows[0].scheduled_for).getTime();
  const inWindow = rows.filter(
    r => new Date(r.scheduled_for).getTime() - earliest <= COMBINE_WINDOW_MS
  );
  const outside = rows.filter(
    r => new Date(r.scheduled_for).getTime() - earliest > COMBINE_WINDOW_MS
  );

  const result: any[] = [];

  if (inWindow.length >= 2) {
    const titles = inWindow.map(r => r.title);
    const combinedTitle = 'Omnia — ' + inWindow.length + ' updates';
    const combinedBody  = titles.slice(0, 3).join(' · ') + (titles.length > 3 ? '…' : '');
    result.push({
      combined:    true,
      title:       combinedTitle,
      body:        combinedBody,
      url:         '/dashboard',
      sourceRows:  inWindow,
    });
  } else {
    result.push(...inWindow);
  }

  result.push(...outside);
  return result;
}

// ── FCM delivery ───────────────────────────────────────────────────────────────

async function deliverToUser(
  s:      any,
  userId: string,
  title:  string,
  body:   string,
  url:    string
): Promise<boolean> {
  const { data: subs } = await s
    .from('push_subscriptions')
    .select('id, fcm_token')
    .eq('user_id', userId);

  if (!subs?.length) return false;

  let sent = false;
  const deadTokens: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub: any) => {
      const result = await sendFcmMessage(sub.fcm_token, title, body, url);
      if (result === 'ok') {
        sent = true;
        // Update last_seen
        await s.from('push_subscriptions')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', sub.id);
      } else if (result === 'invalid_token') {
        deadTokens.push(sub.id);
      }
    })
  );

  // Prune stale tokens
  if (deadTokens.length) {
    await s.from('push_subscriptions').delete().in('id', deadTokens);
  }

  if (sent) {
    await s.from('profiles')
      .update({ last_push_sent: new Date().toISOString() })
      .eq('id', userId);
  }

  return sent;
}

/**
 * Send a single FCM message via the V1 API.
 * Returns 'ok' | 'invalid_token' | 'error'
 */
export async function sendFcmMessage(
  fcmToken: string,
  title:    string,
  body:     string,
  url:      string = '/dashboard'
): Promise<'ok' | 'invalid_token' | 'error'> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !process.env.FIREBASE_SERVICE_ACCOUNT) return 'error';

  try {
    const accessToken = await getOAuthToken();
    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const absoluteUrl = url.startsWith('http') ? url : `${appUrl}${url}`;

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body },
            webpush: {
              headers: { TTL: '86400' },
              notification: {
                title,
                body,
                icon:  '/icon-192.png',
                badge: '/icon-192.png',
                requireInteraction: false,
              },
              fcm_options: { link: absoluteUrl },
              data: { url: absoluteUrl },
            },
          },
        }),
      }
    );

    if (res.ok) return 'ok';

    const err = await res.json().catch(() => ({}));
    const code = err?.error?.details?.[0]?.errorCode ?? err?.error?.status ?? '';

    // Unregistered / invalid-registration = dead token
    if (
      code === 'UNREGISTERED' ||
      code === 'INVALID_ARGUMENT' ||
      res.status === 404
    ) return 'invalid_token';

    return 'error';
  } catch {
    return 'error';
  }
}

// ── OAuth2 token from service account ─────────────────────────────────────────

/** Cache the token to avoid generating a new JWT on every call within the same invocation */
let _cachedToken: { token: string; expiresAt: number } | null = null;

async function getOAuthToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now + 60_000) {
    return _cachedToken.token;
  }

  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
  const jwt = makeServiceAccountJWT(sa);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  const { access_token, expires_in } = await res.json();
  _cachedToken = { token: access_token, expiresAt: now + (expires_in ?? 3600) * 1000 };
  return access_token;
}

function makeServiceAccountJWT(sa: { client_email: string; private_key: string }): string {
  const nowSec = Math.floor(Date.now() / 1000);

  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss:   sa.client_email,
    sub:   sa.client_email,
    aud:   'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    iat:   nowSec,
    exp:   nowSec + 3600,
  })).toString('base64url');

  const data = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(data);
  const sig = sign.sign(sa.private_key, 'base64url');
  return `${data}.${sig}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isInQuietHours(timezone: string): boolean {
  try {
    const hourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour:     'numeric',
      hour12:   false,
    }).format(new Date());
    const hour = parseInt(hourStr, 10);
    return hour >= 22 || hour < 7;
  } catch {
    return false;
  }
}

function getNextSevenAm(timezone: string): Date {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    const candidate = new Date(`${y}-${m}-${d}T07:00:00`);
    if (candidate <= new Date()) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  } catch {
    return new Date(Date.now() + 8 * 3600_000);
  }
}

function getTodayStart(timezone: string): Date {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    return new Date(`${y}-${m}-${d}T00:00:00Z`);
  } catch {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

async function markNotif(
  s:      any,
  id:     string,
  status: string,
  reason: string | null
): Promise<void> {
  await s.from('push_queue').update({
    status,
    skip_reason:  reason,
    processed_at: new Date().toISOString(),
  }).eq('id', id);
}

async function markAll(
  s:      any,
  rows:   any[],
  status: string,
  reason: string | null
): Promise<void> {
  const ids = rows.map(r => r.id ?? r);
  if (!ids.length) return;
  await s.from('push_queue').update({
    status,
    skip_reason:  reason,
    processed_at: new Date().toISOString(),
  }).in('id', ids);
}

async function logPushSent(
  s:      any,
  userId: string,
  type:   string
): Promise<void> {
  await s.from('push_notification_log').insert({
    user_id:           userId,
    notification_type: type,
    sent_at:           new Date().toISOString(),
  });
}
