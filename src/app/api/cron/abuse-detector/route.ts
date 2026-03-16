import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 30;

const HOURLY_REQUEST_THRESHOLD = 50; // flag if > 50 AI requests in last hour

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  // Count chat messages per user in the last hour
  const { data: recentMessages } = await s
    .from('chat_messages')
    .select('user_id')
    .gte('created_at', oneHourAgo)
    .eq('role', 'user');

  if (!recentMessages?.length) return NextResponse.json({ flagged: 0 });

  // Count per user
  const counts: Record<string, number> = {};
  for (const msg of recentMessages) {
    counts[msg.user_id] = (counts[msg.user_id] ?? 0) + 1;
  }

  const flaggedUsers = Object.entries(counts).filter(([, count]) => count > HOURLY_REQUEST_THRESHOLD);

  if (flaggedUsers.length > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'zacharynelson96@gmail.com';

    for (const [userId, count] of flaggedUsers) {
      // Log abuse flag
      await s.from('abuse_flags').insert({
        user_id: userId,
        reason: `Excessive API calls: ${count} requests in 1 hour`,
        api_calls: count,
      });
    }

    const body = flaggedUsers.map(([id, count]) => `User ${id}: ${count} requests/hour`).join('\n');
    await sendEmail({
      to: adminEmail,
      subject: `⚠️ Omnia: ${flaggedUsers.length} abuse flag(s) detected`,
      html: templates.adminAlert('Abuse Detected', `${flaggedUsers.length} user(s) exceeded ${HOURLY_REQUEST_THRESHOLD} requests/hour:\n\n${body}`),
    });
  }

  return NextResponse.json({ flagged: flaggedUsers.length });
}
