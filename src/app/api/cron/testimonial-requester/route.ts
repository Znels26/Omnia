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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const thirtyOneDaysAgo = new Date(Date.now() - 31 * 86400000).toISOString();

  // Users who joined exactly ~30 days ago and have been active (have chat messages)
  const { data: candidates } = await s
    .from('profiles')
    .select('id, email, display_name, full_name, email_notifications')
    .eq('email_notifications', true)
    .gte('created_at', thirtyOneDaysAgo)
    .lt('created_at', thirtyDaysAgo);

  if (!candidates?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    candidates.map(async (user) => {
      // Only ask once ever
      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('email_type', 'testimonial_request')
        .maybeSingle();

      if (already) return;

      // Check they're actually active (have used AI)
      const { count } = await s
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count ?? 0) < 5) return; // Skip inactive users

      const name = user.display_name || user.full_name || 'there';
      await sendEmail({
        to: user.email,
        subject: `${name}, would you share your Omnia experience? ⭐`,
        html: templates.testimonialRequest(name),
      });

      await s.from('cron_email_log').insert({ user_id: user.id, email_type: 'testimonial_request' });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
