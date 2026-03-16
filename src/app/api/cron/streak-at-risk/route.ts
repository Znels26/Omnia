import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { queuePush } from '@/lib/push-scheduler';
import { queueEmail } from '@/lib/email-scheduler';
import { templates } from '@/lib/resend';

export const runtime    = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/streak-at-risk
 * Runs daily at 7pm UTC.
 * Finds users with an active streak (≥ 3 days) who have NOT been active today.
 * Sends a push notification to nudge them before midnight.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s     = createAdminSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  // Users with streaks ≥ 3 days
  const { data: streaks } = await s
    .from('user_streaks')
    .select('user_id, login_streak, last_login_date')
    .gte('login_streak', 3);

  if (!streaks?.length) return NextResponse.json({ fired: 0 });

  // Find which of those users have NOT been active today
  const atRisk = streaks.filter((st: any) => st.last_login_date !== today);

  if (!atRisk.length) return NextResponse.json({ fired: 0 });

  // Load profiles
  const userIds = atRisk.map((st: any) => st.user_id);
  const { data: profiles } = await s
    .from('profiles')
    .select('id, display_name, full_name, email, email_notifications')
    .in('id', userIds);

  const profileMap: Record<string, any> = {};
  for (const p of profiles ?? []) profileMap[p.id] = p;

  let fired = 0;
  await Promise.allSettled(
    atRisk.map(async (st: any) => {
      const profile = profileMap[st.user_id];
      if (!profile) return;

      const days = st.login_streak;
      const name = profile.display_name || profile.full_name || 'there';

      // Push notification (priority 2 — normal, not urgent)
      await queuePush({
        userId:   st.user_id,
        type:     'streak_at_risk',
        priority: 2,
        title:    `${days}-day streak at risk!`,
        body:     `Open Omnia before midnight to keep your ${days}-day streak alive.`,
        url:      '/dashboard',
      });

      // Also queue an email reminder
      if (profile.email_notifications) {
        await queueEmail({
          userId:    st.user_id,
          emailType: 'streak_at_risk',
          priority:  3,
          subject:   `Your ${days}-day Omnia streak is at risk`,
          html:      buildStreakHtml(name, days),
        });
      }

      fired++;
    })
  );

  return NextResponse.json({ fired, atRisk: atRisk.length });
}

function buildStreakHtml(name: string, days: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body
  style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e2e8f0;margin:0;padding:32px 24px">
  <div style="max-width:520px;margin:0 auto">
    <h2 style="font-size:20px;font-weight:700;color:#fff">Hey ${name} 👋</h2>
    <p style="font-size:15px;line-height:1.6;color:#94a3b8">
      You're on a <strong style="color:#fbbf24">${days}-day streak</strong> with Omnia — don't let it slip today!
    </p>
    <p style="font-size:14px;color:#64748b">Just open the app and do anything before midnight to keep it going.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard"
      style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
             padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px">
      Keep my streak →
    </a>
  </div>
</body></html>`;
}
