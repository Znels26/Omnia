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
  const cutoff = new Date(Date.now() - 60 * 86400000).toISOString(); // 60 days ago

  // Find users whose most recent invoice for any client is older than 60 days
  const { data: invoices } = await s
    .from('invoices')
    .select('user_id, client_name, client_email, created_at, profiles(email, display_name, full_name, email_notifications)')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (!invoices?.length) return NextResponse.json({ sent: 0 });

  // Group by user + client, take most recent per client per user
  const seen = new Set<string>();
  const alerts: any[] = [];
  for (const inv of invoices) {
    const key = `${inv.user_id}:${inv.client_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      alerts.push(inv);
    }
  }

  let sent = 0;
  // Group by user and send one email per user listing at-risk clients
  const byUser = new Map<string, any[]>();
  for (const a of alerts) {
    if (!byUser.has(a.user_id)) byUser.set(a.user_id, []);
    byUser.get(a.user_id)!.push(a);
  }

  await Promise.allSettled(
    [...byUser.entries()].map(async ([, userInvoices]) => {
      const first = userInvoices[0];
      const profile = first.profiles;
      const userId = first.user_id;

      const name = profile.display_name || profile.full_name || 'there';
      // Send one alert per at-risk client
      await Promise.allSettled(
        userInvoices.slice(0, 5).map((inv) =>
          queueEmail({
            userId,
            emailType: 'client_retention',
            priority: 2,
            subject: `Client alert: ${inv.client_name} hasn't been invoiced in 60+ days`,
            html: templates.clientRetention(name, inv.client_name, new Date(inv.created_at).toLocaleDateString()),
          })
        )
      );
      sent += userInvoices.slice(0, 5).length;
    })
  );

  return NextResponse.json({ sent });
}
