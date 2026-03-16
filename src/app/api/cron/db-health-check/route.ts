import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const issues: string[] = [];

  // Check table row counts for anomalies
  const checks = await Promise.allSettled([
    s.from('profiles').select('*', { count: 'exact', head: true }),
    s.from('chat_messages').select('*', { count: 'exact', head: true }),
    s.from('tasks').select('*', { count: 'exact', head: true }),
  ]);

  const [profiles, messages, tasks] = checks.map((r) => r.status === 'fulfilled' ? r.value : null);

  if (!profiles || profiles.error) issues.push('profiles table unreachable');
  if (!messages || messages.error) issues.push('chat_messages table unreachable');
  if (!tasks || tasks.error) issues.push('tasks table unreachable');

  const stats = {
    profiles: profiles?.count ?? 0,
    messages: messages?.count ?? 0,
    tasks: tasks?.count ?? 0,
    issues,
    checked_at: new Date().toISOString(),
  };

  await s.from('admin_metrics').insert({ metric_key: 'db_health', metric_value: stats });

  if (issues.length > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'zacharynelson96@gmail.com';
    await sendEmail({
      to: adminEmail,
      subject: `⚠️ Omnia: Database health issues detected`,
      html: templates.adminAlert('Database Health Alert', `The following issues were detected:\n\n${issues.join('\n')}`),
    });
  }

  return NextResponse.json(stats);
}
