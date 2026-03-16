import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST(_req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { invoiceId } = await params;
  const s = createAdminSupabaseClient();
  const { data: inv } = await s.from('invoices').select('*, items:invoice_items(*)').eq('id', invoiceId).eq('user_id', user.id).single();
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth(), m = 20;
    const fmt = (c: number) => `${inv.currency} ${(c/100).toFixed(2)}`;
    doc.setFillColor(10,10,15); doc.rect(0,0,W,50,'F');
    doc.setFontSize(26); doc.setTextColor(14,144,230); doc.text('INVOICE', m, 24);
    doc.setFontSize(10); doc.setTextColor(136,136,136); doc.text(inv.invoice_number, m, 34);
    doc.setFontSize(10); doc.setTextColor(200,200,200);
    [inv.sender_company||inv.sender_name, inv.sender_email||''].filter(Boolean).forEach((l,i) => doc.text(l, W-m, 18+i*7, { align: 'right' }));
    let y = 64;
    doc.setFontSize(9); doc.setTextColor(14,144,230); doc.text('BILL TO', m, y); y+=6;
    doc.setFontSize(11); doc.setTextColor(200,200,200);
    [inv.client_company||inv.client_name, inv.client_email||''].filter(Boolean).forEach(l => { doc.text(l, m, y); y+=6; });
    y+=6;
    doc.setFillColor(20,20,30); doc.rect(m, y, W-m*2, 8, 'F');
    doc.setFontSize(9); doc.setTextColor(14,144,230);
    doc.text('DESCRIPTION', m+3, y+5.5); doc.text('TOTAL', W-m-5, y+5.5, { align: 'right' }); y+=10;
    (inv.items||[]).forEach((item: any, i: number) => {
      if (i%2===0) { doc.setFillColor(15,15,20); doc.rect(m, y-3, W-m*2, 8, 'F'); }
      doc.setFontSize(10); doc.setTextColor(200,200,200);
      doc.text(item.description.slice(0,60), m+3, y+2); doc.text(fmt(item.total_cents), W-m-5, y+2, { align: 'right' }); y+=9;
    });
    y+=6;
    const rows = [['Subtotal', fmt(inv.subtotal_cents)], ...(inv.tax_rate>0?[[`Tax (${inv.tax_rate}%)`, fmt(inv.tax_amount_cents)]]:[]), ['TOTAL DUE', fmt(inv.total_cents)]];
    rows.forEach(([l,v], i) => {
      const last = i===rows.length-1;
      doc.setFontSize(last?13:10); doc.setTextColor(last?14:136, last?144:136, last?230:136);
      doc.text(l, W-m-80, y); doc.setTextColor(last?255:200,last?255:200,last?255:200); doc.text(v, W-m, y, { align: 'right' }); y+=last?12:7;
    });
    const buf = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${inv.invoice_number}.pdf"` } });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { invoiceId } = await params;
  await createAdminSupabaseClient().from('invoices').delete().eq('id', invoiceId).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
