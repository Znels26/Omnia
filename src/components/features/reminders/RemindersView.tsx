'use client';
import { useState } from 'react';
import { Bell, Plus, Trash2, BellOff, Clock, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export function RemindersView({ profile, initialReminders }: any) {
  const [reminders, setReminders] = useState(initialReminders);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', remind_at: '', recurrence: 'none' });

  const create = async () => {
    if (!form.title.trim() || !form.remind_at) { toast.error('Title and time required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return; }
      const { reminder } = await res.json();
      setReminders((p: any[]) => [...p, reminder].sort((a, b) => a.remind_at.localeCompare(b.remind_at)));
      setForm({ title: '', description: '', remind_at: '', recurrence: 'none' }); setShowForm(false);
      toast.success('Reminder set!');
    } finally { setSaving(false); }
  };

  const dismiss = async (id: string) => {
    await fetch(`/api/reminders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'dismissed' }) });
    setReminders((p: any[]) => p.map(r => r.id === id ? { ...r, status: 'dismissed' } : r));
  };

  const del = async (id: string) => {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
    setReminders((p: any[]) => p.filter(r => r.id !== id));
  };

  const now = new Date().toISOString();
  const upcoming = reminders.filter((r: any) => r.status === 'pending');
  const past = reminders.filter((r: any) => r.status !== 'pending');

  return (
    <div className="page" style={{ paddingBottom: '80px', maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div><h1 style={{ fontSize: '24px', fontWeight: 700 }}>Reminders</h1><p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', marginTop: '2px' }}>{upcoming.length} upcoming</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary"><Plus size={15} /> Add Reminder</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Reminder title *" />
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" rows={2} style={{ resize: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Date & Time *</label><input type="datetime-local" value={form.remind_at} onChange={e => setForm(p => ({ ...p, remind_at: e.target.value }))} /></div>
            <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Repeat</label><select value={form.recurrence} onChange={e => setForm(p => ({ ...p, recurrence: e.target.value }))}><option value="none">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowForm(false)} className="btn btn-outline">Cancel</button>
            <button onClick={create} disabled={saving || !form.title.trim() || !form.remind_at} className="btn btn-primary" style={{ flex: 1 }}>{saving ? 'Setting…' : 'Set Reminder'}</button>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Upcoming</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcoming.map((r: any) => (
              <div key={r.id} className="card" style={{ padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(251,146,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bell size={16} color="#fb923c" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{r.title}</p>
                  {r.description && <p style={{ fontSize: '13px', color: 'hsl(240 5% 55%)', marginBottom: '4px' }}>{r.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={11} color="hsl(240 5% 55%)" />
                    <span style={{ fontSize: '12px', color: 'hsl(240 5% 55%)' }}>{formatDate(r.remind_at, 'MMM d, yyyy h:mm a')}</span>
                    {r.recurrence && r.recurrence !== 'none' && <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.1)', color: 'hsl(205, 90%, 60%)', textTransform: 'capitalize' }}>{r.recurrence}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => dismiss(r.id)} style={{ padding: '6px', borderRadius: '7px', background: 'hsl(240 6% 11%)', border: 'none', cursor: 'pointer', display: 'flex', color: 'hsl(240 5% 60%)' }} title="Dismiss"><BellOff size={14} /></button>
                  <button onClick={() => del(r.id)} style={{ padding: '6px', borderRadius: '7px', background: 'hsl(240 6% 11%)', border: 'none', cursor: 'pointer', display: 'flex', color: 'hsl(240 5% 60%)' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reminders.length === 0 && (
        <div className="empty" style={{ paddingTop: '60px' }}>
          <Bell size={40} color="hsl(240 5% 35%)" />
          <p style={{ fontSize: '15px', fontWeight: 500 }}>No reminders yet</p>
          <p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>Never forget important things</p>
          <button onClick={() => setShowForm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205, 90%, 60%)', fontSize: '14px' }}>Set your first reminder</button>
        </div>
      )}

      {past.length > 0 && (
        <div style={{ opacity: 0.5 }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Past</p>
          {past.slice(0, 5).map((r: any) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: '1px solid hsl(240 6% 14%)', marginBottom: '6px' }}>
              <Check size={14} color="hsl(240 5% 50%)" />
              <p style={{ flex: 1, fontSize: '13px', color: 'hsl(240 5% 55%)', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
              <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)' }}>{formatDate(r.remind_at, 'MMM d')}</p>
              <button onClick={() => del(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', display: 'flex', padding: '2px' }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
