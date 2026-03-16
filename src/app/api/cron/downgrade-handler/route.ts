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

  // Find subscriptions that are canceled but profile still shows paid tier
  const { data: canceledSubs } = await s
    .from('subscriptions')
    .select('user_id, plan_tier, current_period_end, profiles(email, display_name, full_name, plan_tier, email_notifications)')
    .eq('status', 'canceled');

  if (!canceledSubs?.length) return NextResponse.json({ downgraded: 0 });

  let downgraded = 0;
  const now = new Date().toISOString();

  await Promise.allSettled(
    canceledSubs.map(async (sub: any) => {
      const profile = sub.profiles;
      if (!profile) return;

      // Check if period has ended
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end).getTime() : 0;
      if (periodEnd > Date.now()) return; // Still in paid period

      // Downgrade if still showing as paid
      if (profile.plan_tier !== 'free') {
        await s.from('profiles').update({ plan_tier: 'free', updated_at: now }).eq('id', sub.user_id);

        const name = profile.display_name || profile.full_name || 'there';
        await queueEmail({
          userId: sub.user_id,
          emailType: 'downgrade',
          priority: 1,
          subject: 'Your Omnia subscription has ended',
          html: templates.downgraded(name),
        });
        downgraded++;
      }
    })
  );

  return NextResponse.json({ downgraded });
}
