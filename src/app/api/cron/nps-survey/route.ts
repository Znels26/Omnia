import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();
  const sixtyOneDaysAgo = new Date(Date.now() - 61 * 86400000).toISOString();

  // Users who joined exactly ~60 days ago
  const { data: candidates } = await s
    .from('profiles')
    .select('id, display_name, full_name')
    .gte('created_at', sixtyOneDaysAgo)
    .lt('created_at', sixtyDaysAgo);

  if (!candidates?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    candidates.map(async (user) => {
      // Only ask once ever
      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('email_type', 'nps_survey')
        .maybeSingle();

      if (already) return;

      const name = user.display_name || user.full_name || 'there';
      await queueEmail({
        userId: user.id,
        emailType: 'nps',
        priority: 4,
        subject: 'Quick question about Omnia',
        html: templates.nps(name),
      });

      await s.from('cron_email_log').insert({ user_id: user.id, email_type: 'nps_survey' });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
