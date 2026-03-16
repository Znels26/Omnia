import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 60;

const FEATURES = [
  { name: 'AI Money Tools', description: 'Track your income, expenses, and get AI-powered financial insights — all in one place.', link: '/life-hub', table: null, emailType: 'nudge_money_tools', planRequired: ['plus', 'pro'] },
  { name: 'Content Studio', description: 'Generate social posts, blog content, and more in seconds with 6 different AI writing modes.', link: '/create', table: 'content_items', emailType: 'nudge_content_studio', planRequired: null },
  { name: 'Invoice Builder', description: 'Create professional invoices, send them to clients, and track payments automatically.', link: '/invoices', table: 'invoices', emailType: 'nudge_invoices', planRequired: null },
  { name: 'Goals & Habits', description: 'Set meaningful goals and build daily habits with AI progress tracking and smart reminders.', link: '/planner', table: 'goals', emailType: 'nudge_goals', planRequired: null },
];

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();

  // Get users older than 14 days
  const { data: users } = await s
    .from('profiles')
    .select('id, email, display_name, full_name, plan_tier, email_notifications')
    .eq('email_notifications', true)
    .lt('created_at', fourteenDaysAgo);

  if (!users?.length) return NextResponse.json({ nudged: 0 });

  let nudged = 0;
  await Promise.allSettled(
    users.map(async (user) => {
      for (const feature of FEATURES) {
        // Skip plan-gated features for non-qualifying users
        if (feature.planRequired && !feature.planRequired.includes(user.plan_tier)) continue;

        const { data: alreadySent } = await s
          .from('cron_email_log')
          .select('id')
          .eq('user_id', user.id)
          .eq('email_type', feature.emailType)
          .maybeSingle();

        if (alreadySent) continue;

        // Check if they've used this feature
        if (feature.table) {
          const { count } = await s
            .from(feature.table as any)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if ((count ?? 0) > 0) {
            // Mark as sent anyway so we don't check again
            await s.from('cron_email_log').insert({ user_id: user.id, email_type: feature.emailType });
            continue;
          }
        }

        const name = user.display_name || user.full_name || 'there';
        await sendEmail({
          to: user.email,
          subject: `Did you know about ${feature.name}? 💡`,
          html: templates.inactiveFeatureNudge(name, feature.name, feature.description, feature.link),
        });

        await s.from('cron_email_log').insert({ user_id: user.id, email_type: feature.emailType });
        nudged++;
        break; // Only one nudge per user per run
      }
    })
  );

  return NextResponse.json({ nudged });
}
