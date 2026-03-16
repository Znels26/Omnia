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
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();

  const { data: allUsers } = await s
    .from('profiles')
    .select('id, display_name, full_name, plan_tier, created_at')
    .lt('created_at', sevenDaysAgo);

  if (!allUsers?.length) return NextResponse.json({ flagged: 0, emailed: 0 });

  const { data: recentChats } = await s
    .from('chat_messages')
    .select('user_id')
    .gte('created_at', sevenDaysAgo);

  const activeUserIds = new Set((recentChats ?? []).map((c: any) => c.user_id));
  const inactiveUsers = allUsers.filter((u) => !activeUserIds.has(u.id));

  let emailed = 0;
  await Promise.allSettled(
    inactiveUsers.map(async (user) => {
      const { data: recentEmail } = await s
        .from('cron_email_log')
        .select('sent_at')
        .eq('user_id', user.id)
        .eq('email_type', 'churn_risk')
        .gte('sent_at', fourteenDaysAgo)
        .maybeSingle();

      if (recentEmail) return;

      const name = user.display_name || user.full_name || 'there';
      await queueEmail({
        userId: user.id,
        emailType: 'churn_risk',
        priority: 4,
        subject: `We miss you, ${name}`,
        html: templates.churnRisk(name),
      });

      await s.from('cron_email_log').upsert(
        { user_id: user.id, email_type: 'churn_risk', sent_at: new Date().toISOString() },
        { onConflict: 'user_id,email_type', ignoreDuplicates: false }
      );
      emailed++;
    })
  );

  return NextResponse.json({ flagged: inactiveUsers.length, emailed });
}
