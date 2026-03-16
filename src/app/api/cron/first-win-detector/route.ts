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
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  let celebrated = 0;

  // First completed task
  const { data: firstTasks } = await s
    .from('tasks')
    .select('user_id, title, completed_at, profiles(email, display_name, full_name, email_notifications)')
    .eq('status', 'completed')
    .gte('completed_at', oneHourAgo);

  await Promise.allSettled(
    (firstTasks ?? []).map(async (task: any) => {
      if (!task.profiles?.email_notifications) return;

      // Check if this is their first completed task
      const { count } = await s
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', task.user_id)
        .eq('status', 'completed');

      if ((count ?? 0) !== 1) return;

      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', task.user_id)
        .eq('email_type', 'first_task')
        .maybeSingle();

      if (already) return;

      const name = task.profiles.display_name || task.profiles.full_name || 'there';
      await sendEmail({
        to: task.profiles.email,
        subject: `You did it, ${name}! First task complete 🎉`,
        html: templates.firstWin(name, 'task', task.title),
      });

      await s.from('cron_email_log').insert({ user_id: task.user_id, email_type: 'first_task' });
      celebrated++;
    })
  );

  // First created invoice
  const { data: firstInvoices } = await s
    .from('invoices')
    .select('user_id, invoice_number, profiles(email, display_name, full_name, email_notifications)')
    .gte('created_at', oneHourAgo);

  await Promise.allSettled(
    (firstInvoices ?? []).map(async (inv: any) => {
      if (!inv.profiles?.email_notifications) return;

      const { count } = await s
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', inv.user_id);

      if ((count ?? 0) !== 1) return;

      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', inv.user_id)
        .eq('email_type', 'first_invoice')
        .maybeSingle();

      if (already) return;

      const name = inv.profiles.display_name || inv.profiles.full_name || 'there';
      await sendEmail({
        to: inv.profiles.email,
        subject: `First invoice created, ${name}! 🎉`,
        html: templates.firstWin(name, 'invoice', `Invoice ${inv.invoice_number}`),
      });

      await s.from('cron_email_log').insert({ user_id: inv.user_id, email_type: 'first_invoice' });
      celebrated++;
    })
  );

  return NextResponse.json({ celebrated });
}
