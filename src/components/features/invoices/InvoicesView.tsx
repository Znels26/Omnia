'use client';
import { useState } from 'react';
import { Receipt, Plus, Download, Trash2, ArrowLeft, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const empty = () => ({ description: '', quantity: 1, unit_price: 0, id: Math.random().toString(36).slice(2) });

export function InvoicesView({ profile, initialInvoices }: any) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [view, setView] = useState<'list'|'create'>('list');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string|null>(null);
  const [items, setItems] = useState([empty()]);
  const [form, setForm] = useState({ client_name:'', client_email:'', client_company:'', sender_name: profile?.display_name || '', sender_email: profile?.email || '', sender_company:'', issue_date: new Date().toISOString().split('T')[0], due_date:'', currency:'USD', tax_rate:0, notes:'', terms:'Payment due within 30 days.' });

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const tax = subtotal * (form.tax_rate / 100);
  const total = subtotal + tax;

  const create = async () => {
    if (!form.client_name) { toast.error('Client name required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tax_rate: parseFloat(String(form.tax_rate)) || 0, items: items.filter(i => i.description).map(i => ({ description: i.description, quantity: i.quantity, unit_price_cents: Math.round(i.unit_price*100), total_cents: Math.round(i.quantity*i.unit_price*100) })) }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Failed'); return; }
      setInvoices((p: any[]) => [d.invoice, ...p]);
      setView('list'); toast.success('Invoice created!');
    } finally { setSaving(false); }
  };

  const exportPdf = async (inv: any) => {
    setExporting(inv.id);
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, { method: 'POST' });
      if (!res.ok) { toast.error('Export failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${inv.invoice_number || 'invoice'}.pdf`; a.click();
      URL.revokeObjectURL(url); toast.success('Downloaded!');
    } finally { setExporting(null); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete invoice?')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    setInvoices((p: any[]) => p.filter(i => i.id !== id));
  };

  const STATUS_COLORS: any = { draft: '#6b7280', sent: '#38aaf5', paid: '#34d399', overdue: '#ef4444' };

  if (view === 'create') return (
    <div className="page" style={{ paddingBottom: '80px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', display: 'flex', padding: '6px' }}><ArrowLeft size={18} /></button>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>New Invoice</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {[
          { title: 'From', fields: [['sender_name','Your name *'],['sender_email','Email'],['sender_company','Company']] },
          { title: 'Bill To', fields: [['client_name','Client name *'],['client_email','Email'],['client_company','Company']] }
        ].map(({ title, fields }) => (
          <div key={title} className="card" style={{ padding: '16px' }}>
            <p style={{ fontWeight: 600, fontSize: '13px', color: 'hsl(240 5% 50%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fields.map(([k, ph]) => <input key={k} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={{ height: '36px', fontSize: '13px' }} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[['issue_date','date','Issue Date'],['due_date','date','Due Date'],['currency','select','Currency'],['tax_rate','number','Tax %']].map(([k,t,l]) => (
            <div key={k}>
              <label style={{ display: 'block', fontSize: '11px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>{l}</label>
              {t === 'select' ? <select value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ height: '34px', fontSize: '13px' }}><option>USD</option><option>EUR</option><option>GBP</option><option>AUD</option></select> : <input type={t} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ height: '34px', fontSize: '13px' }} />}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px 30px', gap: '6px', marginBottom: '6px', padding: '0 4px' }}>
          {['Description','Qty','Price','Total',''].map(h => <span key={h} style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', fontWeight: 600 }}>{h}</span>)}
        </div>
        {items.map((item, i) => (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px 30px', gap: '6px', marginBottom: '6px' }}>
            <input value={item.description} onChange={e => setItems(p => p.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it))} placeholder="Item" style={{ height: '34px', fontSize: '13px' }} />
            <input type="number" min="1" value={item.quantity} onChange={e => setItems(p => p.map((it, idx) => idx === i ? { ...it, quantity: parseFloat(e.target.value)||1 } : it))} style={{ height: '34px', fontSize: '13px', textAlign: 'center' }} />
            <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => setItems(p => p.map((it, idx) => idx === i ? { ...it, unit_price: parseFloat(e.target.value)||0 } : it))} style={{ height: '34px', fontSize: '13px' }} />
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 500 }}>{formatCurrency(Math.round(item.quantity*item.unit_price*100))}</span>
            {items.length > 1 && <button onClick={() => setItems(p => p.filter((_,idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center', padding: 0 }}><X size={13} /></button>}
          </div>
        ))}
        <button onClick={() => setItems(p => [...p, empty()])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205, 90%, 60%)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>+ Add item</button>
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid hsl(240 6% 14%)', display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '240px', marginLeft: 'auto' }}>
          {[['Subtotal', formatCurrency(Math.round(subtotal*100))], form.tax_rate > 0 && [`Tax (${form.tax_rate}%)`, formatCurrency(Math.round(tax*100))], ['Total Due', formatCurrency(Math.round(total*100))]].filter(Boolean).map(([l,v]: any, idx, arr) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: idx === arr.length-1 ? 700 : 400, fontSize: idx === arr.length-1 ? '16px' : '14px', color: idx === arr.length-1 ? 'hsl(205, 90%, 60%)' : 'hsl(0 0% 80%)' }}>
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Notes for client…" style={{ resize: 'none', fontSize: '13px' }} /></div>
        <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Terms</label><textarea value={form.terms} onChange={e => setForm(p => ({ ...p, terms: e.target.value }))} rows={3} style={{ resize: 'none', fontSize: '13px' }} /></div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setView('list')} className="btn btn-outline">Cancel</button>
        <button onClick={create} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>{saving ? 'Creating…' : <><Receipt size={14} /> Create Invoice</>}</button>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div><h1 style={{ fontSize: '24px', fontWeight: 700 }}>Invoices</h1><p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', marginTop: '2px' }}>Create and export professional invoices</p></div>
        <button onClick={() => setView('create')} className="btn btn-primary"><Plus size={15} /> New Invoice</button>
      </div>
      {invoices.length === 0 ? (
        <div className="empty" style={{ paddingTop: '60px' }}><Receipt size={40} color="hsl(240 5% 35%)" /><p style={{ fontSize: '15px', fontWeight: 500 }}>No invoices yet</p><p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>Create your first professional invoice</p><button onClick={() => setView('create')} className="btn btn-primary" style={{ marginTop: '8px' }}><Plus size={14} /> Create Invoice</button></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {invoices.map((inv: any) => (
            <div key={inv.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'hsl(240 5% 50%)' }}>{inv.invoice_number}</span>
                  <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '999px', background: `${STATUS_COLORS[inv.status] || '#888'}20`, color: STATUS_COLORS[inv.status] || '#888', fontWeight: 600, textTransform: 'capitalize' }}>{inv.status}</span>
                </div>
                <p style={{ fontWeight: 600, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.client_name}</p>
                {inv.client_company && <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)' }}>{inv.client_company}</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(205, 90%, 60%)' }}>{formatCurrency(inv.total_cents, inv.currency)}</p>
                <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)' }}>{formatDate(inv.issue_date)}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => exportPdf(inv)} disabled={exporting === inv.id} style={{ padding: '8px', borderRadius: '8px', background: 'hsl(240 6% 11%)', border: 'none', cursor: 'pointer', display: 'flex', color: 'hsl(240 5% 70%)' }} title="Export PDF"><Download size={15} /></button>
                <button onClick={() => del(inv.id)} style={{ padding: '8px', borderRadius: '8px', background: 'hsl(240 6% 11%)', border: 'none', cursor: 'pointer', display: 'flex', color: 'hsl(240 5% 70%)' }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
