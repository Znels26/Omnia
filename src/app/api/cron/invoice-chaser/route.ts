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
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Find sent invoices that are past due date
  const { data: invoices } = await s
    .from('invoices')
    .select('id, invoice_number, client_name, client_email, sender_email, total_cents, currency, due_date')
    .eq('status', 'sent')
    .not('client_email', 'is', null)
    .lt('due_date', todayStr)
    .not('due_date', 'is', null);

  if (!invoices?.length) return NextResponse.json({ chased: 0 });

  let chased = 0;
  await Promise.allSettled(
    invoices.map(async (inv) => {
      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);

      // Only chase at day 1, 7, 14, 30 overdue to avoid spamming
      if (![1, 7, 14, 30].includes(daysOverdue)) return;

      const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(inv.total_cents / 100);

      await sendEmail({
        to: inv.client_email,
        subject: `Payment Reminder: ${inv.invoice_number}`,
        html: templates.invoiceChaser(inv.client_name, inv.invoice_number, amount, daysOverdue, inv.sender_email),
      });
      chased++;
    })
  );

  return NextResponse.json({ chased });
}
