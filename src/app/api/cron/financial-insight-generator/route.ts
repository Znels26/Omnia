import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function generateInsight(name: string, invoiceData: any): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return `You've sent ${invoiceData.total} invoices this month totalling ${invoiceData.totalAmount}. Keep tracking your finances for better insights!`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Write a brief, actionable financial insight for ${name} based on their invoice data this week:
Total invoices: ${invoiceData.total}
Paid invoices: ${invoiceData.paid}
Outstanding: ${invoiceData.outstanding}
Total amount invoiced: ${invoiceData.totalAmount}
Overdue invoices: ${invoiceData.overdue}

Write 2-3 paragraphs with practical advice. Be specific and encouraging.`,
      }],
    }),
  });

  if (!res.ok) return `You have ${invoiceData.outstanding} outstanding invoices. Consider sending payment reminders to improve cash flow.`;
  const json = await res.json();
  return json.content?.[0]?.text ?? 'Keep tracking your finances for better insights!';
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: users } = await s
    .from('profiles')
    .select('id, email, display_name, full_name, plan_tier')
    .in('plan_tier', ['plus', 'pro']);

  if (!users?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const user of users.slice(0, 30)) {
    const { data: invoices } = await s
      .from('invoices')
      .select('status, total_cents')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo);

    if (!invoices?.length) continue;

    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_cents ?? 0), 0);
    const invoiceData = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      outstanding: invoices.filter(i => i.status === 'sent').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      totalAmount: `$${(totalAmount / 100).toFixed(2)}`,
    };

    const name = user.display_name || user.full_name || 'there';
    const insight = await generateInsight(name, invoiceData);

    await queueEmail({
      userId: user.id,
      emailType: 'financial_insight',
      priority: 3,
      subject: 'Your weekly financial insight from Omnia',
      html: templates.financialInsight(name, insight),
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
