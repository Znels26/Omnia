import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MILESTONES = [
  { table: 'tasks', column: 'status', value: 'completed', label: 'tasks completed', emailType: 'milestone_tasks', thresholds: [10, 50, 100, 250, 500] },
  { table: 'notes', column: null, value: null, label: 'notes created', emailType: 'milestone_notes', thresholds: [10, 50, 100] },
  { table: 'invoices', column: null, value: null, label: 'invoices created', emailType: 'milestone_invoices', thresholds: [5, 10, 25, 50] },
];

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  let celebrated = 0;

  for (const milestone of MILESTONES) {
    let query = s.from(milestone.table as any).select('user_id');
    if (milestone.column && milestone.value) {
      query = (query as any).eq(milestone.column, milestone.value);
    }

    const { data: rows } = await query;
    if (!rows?.length) continue;

    // Count per user
    const counts: Record<string, number> = {};
    for (const row of rows as any[]) {
      counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
    }

    await Promise.allSettled(
      Object.entries(counts).map(async ([userId, count]) => {
        const hitThreshold = milestone.thresholds.find((t) => count === t);
        if (!hitThreshold) return;

        const emailType = `${milestone.emailType}_${hitThreshold}`;
        const { data: already } = await s
          .from('cron_email_log')
          .select('id')
          .eq('user_id', userId)
          .eq('email_type', emailType)
          .maybeSingle();

        if (already) return;

        const { data: profile } = await s
          .from('profiles')
          .select('email, display_name, full_name, email_notifications')
          .eq('id', userId)
          .maybeSingle();

        if (!profile) return;

        const name = profile.display_name || profile.full_name || 'there';
        await queueEmail({
          userId,
          emailType: 'milestone',
          priority: 3,
          subject: `${hitThreshold} ${milestone.label} — you're on a roll! 🏆`,
          html: templates.milestoneCelebration(name, hitThreshold, milestone.label),
        });

        await s.from('cron_email_log').insert({ user_id: userId, email_type: emailType });
        celebrated++;
      })
    );
  }

  return NextResponse.json({ celebrated });
}
