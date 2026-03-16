import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  // Invoices marked as recurring that need their next copy created today
  const { data: invoices } = await s
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('status', 'recurring')
    .lte('due_date', today);

  if (!invoices?.length) return NextResponse.json({ created: 0 });

  let created = 0;
  await Promise.allSettled(
    invoices.map(async (inv: any) => {
      const issueDate = new Date();
      const dueDate = new Date(issueDate);
      const originalDueDate = new Date(inv.due_date);
      const originalIssueDate = new Date(inv.issue_date);
      const netDays = Math.round((originalDueDate.getTime() - originalIssueDate.getTime()) / 86400000);
      dueDate.setDate(dueDate.getDate() + netDays);

      // Generate new invoice number
      const { data: count } = await s.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', inv.user_id);
      const num = `INV-${issueDate.getFullYear()}-${String(((count as any)?.length || 0) + 1).padStart(4, '0')}`;

      const { data: newInv, error } = await s.from('invoices').insert({
        user_id: inv.user_id,
        invoice_number: num,
        client_name: inv.client_name,
        client_email: inv.client_email,
        client_company: inv.client_company,
        sender_name: inv.sender_name,
        sender_email: inv.sender_email,
        sender_company: inv.sender_company,
        issue_date: issueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        currency: inv.currency,
        tax_rate: inv.tax_rate,
        subtotal_cents: inv.subtotal_cents,
        tax_amount_cents: inv.tax_amount_cents,
        total_cents: inv.total_cents,
        notes: inv.notes,
        terms: inv.terms,
        status: 'draft',
      }).select().single();

      if (error || !newInv) return;

      if (inv.invoice_items?.length) {
        await s.from('invoice_items').insert(
          inv.invoice_items.map((item: any, idx: number) => ({
            invoice_id: newInv.id,
            description: item.description,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            total_cents: item.total_cents,
            sort_order: idx,
          }))
        );
      }

      // Update original to next due date (monthly recurrence)
      const nextDue = new Date(inv.due_date);
      nextDue.setMonth(nextDue.getMonth() + 1);
      await s.from('invoices').update({ due_date: nextDue.toISOString().split('T')[0] }).eq('id', inv.id);

      created++;
    })
  );

  return NextResponse.json({ created });
}
