import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  // Free users who have used at least 5 AI requests (engaged users worth upselling)
  const { data: rows } = await s
    .from('usage_counters')
    .select('user_id, ai_requests_used, profiles(display_name, full_name, plan_tier)')
    .gte('ai_requests_used', 5);

  if (!rows?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    rows.map(async (row: any) => {
      const profile = row.profiles;
      if (profile.plan_tier !== 'free') return;

      const name = profile.display_name || profile.full_name || 'there';
      const stat = `you've used ${row.ai_requests_used} AI requests this month`;
      await queueEmail({
        userId: row.user_id,
        emailType: 'upsell',
        priority: 4,
        subject: "You're getting the most out of Omnia",
        html: templates.upsell(name, 'free', stat),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
