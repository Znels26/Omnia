import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
  const fortyEightHoursAgo = new Date(Date.now() - 2 * 86400000).toISOString();

  // New users who haven't completed onboarding and are 24-48h old
  const { data: newUsers } = await s
    .from('profiles')
    .select('id, email, display_name, full_name, email_notifications, onboarding_completed')
    .eq('onboarding_completed', false)
    .gte('created_at', fortyEightHoursAgo)
    .lte('created_at', twentyFourHoursAgo);

  if (!newUsers?.length) return NextResponse.json({ nudged: 0 });

  let nudged = 0;
  await Promise.allSettled(
    newUsers.map(async (user) => {
      if (!user.email_notifications) return;

      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('email_type', 'onboarding_nudge')
        .maybeSingle();

      if (already) return;

      const name = user.display_name || user.full_name || 'there';
      await sendEmail({
        to: user.email,
        subject: `You're almost set up on Omnia, ${name} 🚀`,
        html: templates.onboardingNudge(name, 'Complete your profile and try the AI assistant'),
      });

      await s.from('cron_email_log').insert({ user_id: user.id, email_type: 'onboarding_nudge' });
      nudged++;
    })
  );

  return NextResponse.json({ nudged });
}
