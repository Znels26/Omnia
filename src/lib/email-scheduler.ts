/**
 * OMNIA EMAIL SCHEDULER
 * =====================
 * Central rules engine for all user-facing email sending.
 *
 * Rules enforced:
 *  - Max 1 email/day, 3 emails/week per user
 *  - 20h cooldown between any emails
 *  - No emails between 10pm–6am in user's local timezone
 *  - No emails on Christmas Day (Dec 25)
 *  - Priority hierarchy: P1 always sends, P2 max 1/day, P3–4 digest if 2+
 *  - Respects per-category email preferences on profile
 *  - Checks email_unsubscribes table for type-level unsubscribes
 *  - Injects unsubscribe footer into every outbound email
 *
 * Usage in cron jobs:
 *   import { queueEmail } from '@/lib/email-scheduler';
 *   await queueEmail({ userId, emailType: 'morning_briefing', priority: 2, subject, html });
 *
 * The email-dispatcher cron calls dispatchEmails() every 15 minutes.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EmailPriority = 1 | 2 | 3 | 4 | 5;

export interface QueueEmailParams {
  userId: string;
  emailType: string;
  priority: EmailPriority;
  subject: string;
  html: string;
  plainText?: string;
  scheduledFor?: Date;
}

export interface DispatchResult {
  sent: number;
  skipped: number;
  digested: number;
}

// ── Email preference field mapping ────────────────────────────────────────────
// Maps email_type → profile column. If column is false, email is skipped.
// Undefined means no preference check (always send if notifications=true).
const PREF_MAP: Record<string, string> = {
  morning_briefing:   'email_morning_briefing',
  weekly_review:      'email_weekly_review',
  goal_checkin:       'email_weekly_review',
  financial_insight:  'email_finance_alerts',
  fitness_insight:    'email_fitness_alerts',
  milestone:          'email_milestone_alerts',
  upsell:             'email_marketing',
  upgrade_prompt:     'email_marketing',
  content_ideas:      'email_marketing',
  feature_nudge:      'email_marketing',
  win_back:           'email_marketing',
  nps:                'email_marketing',
  testimonial:        'email_marketing',
  anniversary:        'email_marketing',
  churn_risk:         'email_marketing',
};

// P1 email types that bypass the daily/weekly limit (but still respect quiet hours unless transactional)
const TRANSACTIONAL_TYPES = new Set(['dunning', 'trial_expiry', 'subscription_alert', 'downgrade', 'first_win']);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Add an email to the queue. Call this from cron jobs instead of sendEmail() directly.
 * The dispatcher will process it with all rules applied.
 */
export async function queueEmail(params: QueueEmailParams): Promise<void> {
  const s = createAdminSupabaseClient();
  await s.from('email_queue').insert({
    user_id: params.userId,
    email_type: params.emailType,
    priority: params.priority,
    subject: params.subject.slice(0, 50), // enforce 50-char subject limit
    html_content: params.html,
    plain_text: params.plainText ?? stripHtml(params.html),
    category: params.emailType,
    scheduled_for: (params.scheduledFor ?? new Date()).toISOString(),
    status: 'pending',
  });
}

/**
 * Process all pending emails from the queue.
 * Called by the email-dispatcher cron every 15 minutes.
 */
export async function dispatchEmails(): Promise<DispatchResult> {
  const s = createAdminSupabaseClient();
  const now = new Date().toISOString();

  // Fetch all pending emails due for sending, ordered by priority then age
  const { data: pending } = await s
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (!pending?.length) return { sent: 0, skipped: 0, digested: 0 };

  // Group by user
  const byUser: Record<string, any[]> = {};
  for (const email of pending) {
    byUser[email.user_id] ??= [];
    byUser[email.user_id].push(email);
  }

  let sent = 0, skipped = 0, digested = 0;

  for (const [userId, emails] of Object.entries(byUser)) {
    const result = await processUserEmails(s, userId, emails);
    sent     += result.sent;
    skipped  += result.skipped;
    digested += result.digested;
  }

  return { sent, skipped, digested };
}

// ── Per-user processing ───────────────────────────────────────────────────────

async function processUserEmails(
  s: any,
  userId: string,
  emails: any[]
): Promise<DispatchResult> {
  let sent = 0, skipped = 0, digested = 0;

  // Load user profile with all preference fields
  const { data: profile } = await s
    .from('profiles')
    .select([
      'id', 'email', 'display_name', 'full_name', 'timezone', 'last_email_sent',
      'email_notifications', 'preferred_email_time',
      'email_morning_briefing', 'email_weekly_review', 'email_finance_alerts',
      'email_fitness_alerts', 'email_milestone_alerts', 'email_marketing',
    ].join(', '))
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.email) {
    await markAll(s, emails, 'skipped', 'no_profile');
    return { sent: 0, skipped: emails.length, digested: 0 };
  }

  // Load unsubscribed types for this user
  const { data: unsubs } = await s
    .from('email_unsubscribes')
    .select('email_type')
    .eq('user_id', userId);

  const unsubTypes = new Set((unsubs ?? []).map((u: any) => u.email_type));
  const unsubAll = unsubTypes.has('all');

  // Separate P1 from rest early
  const urgent    = emails.filter(e => e.priority === 1);
  const nonUrgent = emails.filter(e => e.priority > 1);

  // ── Process Priority 1 (urgent) ──────────────────────────────────────────

  for (const email of urgent) {
    const isTransactional = TRANSACTIONAL_TYPES.has(email.email_type);

    // Transactional P1 (payment failure, trial expiry): send even if unsubscribed
    // Non-transactional P1: respect email_notifications and unsubscribe
    if (!isTransactional && (!profile.email_notifications || unsubAll || unsubTypes.has(email.email_type))) {
      await markEmail(s, email.id, 'skipped', 'notifications_off');
      skipped++;
      continue;
    }

    // Christmas day — reschedule non-transactional to tomorrow 6am
    if (isChristmas() && !isTransactional) {
      const reschedule = getNextSixAm(profile.timezone);
      await s.from('email_queue').update({ scheduled_for: reschedule.toISOString() }).eq('id', email.id);
      continue;
    }

    // Quiet hours — reschedule to next 6am in user timezone
    if (!isTransactional && isInQuietHours(profile.timezone)) {
      const reschedule = getNextSixAm(profile.timezone);
      await s.from('email_queue').update({ scheduled_for: reschedule.toISOString() }).eq('id', email.id);
      continue;
    }

    await sendQueued(s, email, profile);
    await updateLastSent(s, userId);
    sent++;
  }

  // ── Process Priority 2–4 ─────────────────────────────────────────────────

  if (!nonUrgent.length) return { sent, skipped, digested };

  // Global opt-out
  if (!profile.email_notifications || unsubAll) {
    await markAll(s, nonUrgent, 'skipped', 'notifications_off');
    return { sent, skipped: skipped + nonUrgent.length, digested };
  }

  // Christmas day
  if (isChristmas()) {
    await markAll(s, nonUrgent, 'skipped', 'christmas');
    return { sent, skipped: skipped + nonUrgent.length, digested };
  }

  // Quiet hours — reschedule to next 6am
  if (isInQuietHours(profile.timezone)) {
    const reschedule = getNextSixAm(profile.timezone);
    for (const e of nonUrgent) {
      await s.from('email_queue').update({ scheduled_for: reschedule.toISOString() }).eq('id', e.id);
    }
    return { sent, skipped, digested };
  }

  // 20-hour cooldown since last email
  if (profile.last_email_sent) {
    const hoursSince = (Date.now() - new Date(profile.last_email_sent).getTime()) / 3600000;
    if (hoursSince < 20) {
      const reschedule = new Date(new Date(profile.last_email_sent).getTime() + 20 * 3600000);
      for (const e of nonUrgent) {
        await s.from('email_queue').update({ scheduled_for: reschedule.toISOString() }).eq('id', e.id);
      }
      return { sent, skipped, digested };
    }
  }

  // Daily limit: 1 non-urgent email per day
  const todayStart = getTodayStart(profile.timezone);
  const { count: todaySent } = await s
    .from('cron_email_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', todayStart.toISOString());

  if ((todaySent ?? 0) >= 1) {
    await markAll(s, nonUrgent, 'skipped', 'daily_limit');
    return { sent, skipped: skipped + nonUrgent.length, digested };
  }

  // Weekly limit: 3 non-urgent emails per week
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: weekSent } = await s
    .from('cron_email_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', weekStart);

  if ((weekSent ?? 0) >= 3) {
    await markAll(s, nonUrgent, 'skipped', 'weekly_limit');
    return { sent, skipped: skipped + nonUrgent.length, digested };
  }

  // Filter by per-category preference and unsubscribes
  const allowed: any[] = [];
  const blocked: any[] = [];

  for (const email of nonUrgent) {
    const prefField = PREF_MAP[email.email_type];
    const prefOff = prefField && profile[prefField] === false;
    const unsub = unsubTypes.has(email.email_type);

    if (prefOff || unsub) {
      blocked.push(email);
    } else {
      allowed.push(email);
    }
  }

  if (blocked.length) {
    await markAll(s, blocked, 'skipped', 'user_preference');
    skipped += blocked.length;
  }

  if (!allowed.length) return { sent, skipped, digested };

  // Priority hierarchy: keep highest priority group
  const p2 = allowed.filter(e => e.priority === 2);
  const p3 = allowed.filter(e => e.priority === 3);
  const p4 = allowed.filter(e => e.priority === 4);

  if (p2.length) {
    // Send highest P2 only; skip rest including all P3/P4
    const toSend = p2[0];
    await sendQueued(s, toSend, profile);
    await logEmailSent(s, userId, toSend.email_type);
    await updateLastSent(s, userId);
    sent++;

    const toSkip = [...p2.slice(1), ...p3, ...p4];
    if (toSkip.length) { await markAll(s, toSkip, 'skipped', 'priority_override'); skipped += toSkip.length; }

  } else {
    // P3 and P4 available — digest if 2 or more, otherwise send the single one
    const digestCandidates = [...p3, ...p4].slice(0, 3);
    const overflow = [...p3, ...p4].slice(3);

    if (overflow.length) { await markAll(s, overflow, 'skipped', 'digest_overflow'); skipped += overflow.length; }

    if (digestCandidates.length >= 2) {
      const name = profile.display_name || profile.full_name || 'there';
      const digestHtml = buildDigestHtml(name, digestCandidates);
      const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

      await sendEmail({
        to: profile.email,
        subject: `Your Omnia Update — ${today}`.slice(0, 50),
        html: withUnsubscribeFooter(digestHtml, userId),
      });

      await markAll(s, digestCandidates, 'sent', null);
      await logEmailSent(s, userId, 'digest');
      await updateLastSent(s, userId);
      digested += digestCandidates.length;
      sent++;

    } else if (digestCandidates.length === 1) {
      await sendQueued(s, digestCandidates[0], profile);
      await logEmailSent(s, userId, digestCandidates[0].email_type);
      await updateLastSent(s, userId);
      sent++;
    }
  }

  return { sent, skipped, digested };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isInQuietHours(timezone: string): boolean {
  try {
    const hourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    const hour = parseInt(hourStr, 10);
    return hour >= 22 || hour < 6;
  } catch {
    return false;
  }
}

function isChristmas(): boolean {
  const now = new Date();
  return now.getMonth() === 11 && now.getDate() === 25;
}

function getNextSixAm(timezone: string): Date {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    const candidate = new Date(`${y}-${m}-${d}T06:00:00`);
    if (candidate <= new Date()) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  } catch {
    return new Date(Date.now() + 8 * 3600000);
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
}

function extractBodyContent(html: string): string {
  // Try to extract just the card body (strips Omnia header/footer)
  const cardMatch = html.match(/<div class="card">([\s\S]*?)<\/div>\s*(?:<div class="footer">|$)/);
  if (cardMatch) {
    return cardMatch[1].replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '').trim();
  }
  // Fallback: return stripped body
  return `<p>${stripHtml(html).slice(0, 400)}</p>`;
}

export function withUnsubscribeFooter(html: string, userId: string): string {
  const token = Buffer.from(userId).toString('base64url');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const unsubUrl = `${appUrl}/api/unsubscribe?token=${token}&type=all`;
  const settingsUrl = `${appUrl}/settings`;

  const footer = `
<div style="text-align:center;font-size:11px;color:#475569;margin-top:24px;padding:0 16px">
  Omnia · omnia-ai.space · hello@omnia-ai.space<br>
  123 Example Street, Sydney NSW 2000, Australia<br>
  <a href="${settingsUrl}" style="color:#64748b">Manage email preferences</a>
  &nbsp;·&nbsp;
  <a href="${unsubUrl}" style="color:#64748b">Unsubscribe from all emails</a>
</div>`;

  // Replace existing footer div if present, otherwise inject before </body>
  if (html.includes('<div class="footer">')) {
    return html.replace(
      /<div class="footer">[\s\S]*?<\/div>/,
      footer
    );
  }
  return html.replace('</body>', `${footer}</body>`);
}

function buildDigestHtml(name: string, emails: any[]): string {
  const sections = emails
    .map(e => `
      <div style="margin-bottom:20px">
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin:0 0 6px">
          ${e.email_type.replace(/_/g, ' ')}
        </p>
        <p style="font-size:14px;font-weight:600;color:#e2e8f0;margin:0 0 10px">${e.subject}</p>
        <div style="font-size:13px;color:#94a3b8;line-height:1.6">
          ${extractBodyContent(e.html_content)}
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #1e1e2e;margin:16px 0">
    `)
    .join('');

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e2e8f0;margin:0;padding:0}
.wrap{max-width:600px;margin:0 auto;padding:32px 24px}
.card{background:#111118;border:1px solid #1e1e2e;border-radius:12px;padding:28px}
h1{font-size:20px;font-weight:700;color:#fff;margin:0 0 4px}
p{font-size:14px;line-height:1.6;color:#94a3b8;margin:0 0 12px}
ul{padding-left:18px;margin:0 0 12px}li{font-size:14px;color:#94a3b8;line-height:1.7}
a{color:#60a5fa}
</style></head><body>
<div class="wrap">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
    <div style="width:32px;height:32px;background:#1d3a5f;border-radius:8px;text-align:center;line-height:32px;font-size:16px">✦</div>
    <span style="font-weight:700;font-size:18px;color:#fff">Omnia</span>
  </div>
  <div class="card">
    <h1>Your Omnia Update</h1>
    <p style="color:#64748b;font-size:13px;margin:2px 0 20px">${today}</p>
    <hr style="border:none;border-top:1px solid #1e1e2e;margin:0 0 20px">
    <p>Hey ${name}, here's everything in one place today.</p>
    <hr style="border:none;border-top:1px solid #1e1e2e;margin:16px 0">
    ${sections}
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard"
       style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;margin-top:4px">
      Open Dashboard →
    </a>
  </div>
</div>
</body></html>`;
}

async function sendQueued(s: any, email: any, profile: any): Promise<void> {
  const html = withUnsubscribeFooter(email.html_content, email.user_id);
  await sendEmail({ to: profile.email, subject: email.subject, html });
  await markEmail(s, email.id, 'sent', null);
}

async function markEmail(s: any, id: string, status: string, reason: string | null): Promise<void> {
  await s.from('email_queue').update({
    status,
    skip_reason: reason,
    processed_at: new Date().toISOString(),
  }).eq('id', id);
}

async function markAll(s: any, emails: any[], status: string, reason: string | null): Promise<void> {
  const ids = emails.map(e => e.id);
  if (!ids.length) return;
  await s.from('email_queue').update({
    status,
    skip_reason: reason,
    processed_at: new Date().toISOString(),
  }).in('id', ids);
}

async function logEmailSent(s: any, userId: string, emailType: string): Promise<void> {
  const key = `daily_${new Date().toISOString().split('T')[0]}_${emailType}`;
  await s.from('cron_email_log').upsert(
    { user_id: userId, email_type: key, sent_at: new Date().toISOString() },
    { onConflict: 'user_id,email_type', ignoreDuplicates: false }
  );
}

async function updateLastSent(s: any, userId: string): Promise<void> {
  await s.from('profiles').update({ last_email_sent: new Date().toISOString() }).eq('id', userId);
}
