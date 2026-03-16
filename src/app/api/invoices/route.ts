import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST(req: NextRequest) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const s = createAdminSupabaseClient();
  const { data: count } = await s.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  const num = `INV-${new Date().getFullYear()}-${String(((count as any)?.length || 0) + 1).padStart(4,'0')}`;
  const subtotal = (body.items || []).reduce((s: number, i: any) => s + i.total_cents, 0);
  const tax = Math.round(subtotal * (body.tax_rate || 0) / 100);
  const total = subtotal + tax;
  const { data: inv, error } = await s.from('invoices').insert({ user_id: user.id, invoice_number: num, client_name: body.client_name, client_email: body.client_email, client_company: body.client_company, sender_name: body.sender_name, sender_email: body.sender_email, sender_company: body.sender_company, issue_date: body.issue_date, due_date: body.due_date || null, currency: body.currency || 'USD', tax_rate: body.tax_rate || 0, subtotal_cents: subtotal, tax_amount_cents: tax, total_cents: total, notes: body.notes, terms: body.terms, status: 'draft' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (body.items?.length) {
    await s.from('invoice_items').insert(body.items.map((item: any, idx: number) => ({ invoice_id: inv.id, description: item.description, quantity: item.quantity, unit_price_cents: item.unit_price_cents, total_cents: item.total_cents, sort_order: idx })));
  }
  return NextResponse.json({ invoice: { ...inv, items: body.items || [] } }, { status: 201 });
}
