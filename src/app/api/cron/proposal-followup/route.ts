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

  // Follow up on sent invoices with notes containing "proposal" that are 3 and 7 days old
  const day3ago = new Date(Date.now() - 3 * 86400000);
  const day7ago = new Date(Date.now() - 7 * 86400000);

  const checkDates = [day3ago, day7ago].map((d) => d.toISOString().split('T')[0]);

  let sent = 0;
  for (const dateStr of checkDates) {
    const { data: invoices } = await s
      .from('invoices')
      .select('id, client_name, client_email, sender_email, notes, issue_date, profiles(email, display_name, email_notifications)')
      .eq('status', 'sent')
      .not('client_email', 'is', null)
      .gte('issue_date', dateStr + 'T00:00:00Z')
      .lte('issue_date', dateStr + 'T23:59:59Z');

    if (!invoices?.length) continue;

    await Promise.allSettled(
      invoices.map(async (inv: any) => {
        if (!inv.client_email) return;
        const sentDate = new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        await sendEmail({
          to: inv.client_email,
          subject: `Following up on your proposal`,
          html: templates.proposalFollowUp(inv.client_name, 'your project', sentDate, inv.sender_email || ''),
        });
        sent++;
      })
    );
  }

  return NextResponse.json({ sent });
}
