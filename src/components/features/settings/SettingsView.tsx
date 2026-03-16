'use client';
import { useState, useEffect } from 'react';
import { User, Bell, LogOut, Brain, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const MODES = [{ v: 'general', l: '✨ General' }, { v: 'productivity', l: '⚡ Productivity' }, { v: 'writing', l: '✍️ Writing' }, { v: 'study', l: '📚 Study' }, { v: 'planning', l: '🎯 Planning' }, { v: 'documents', l: '📄 Documents' }];

export function SettingsView({ profile }: any) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ display_name: profile?.display_name || '', full_name: profile?.full_name || '', assistant_mode: profile?.assistant_mode || 'general', email_notifications: profile?.email_notifications ?? true });
  const [memories, setMemories] = useState<any[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/memories').then(r => r.json()).then(d => setMemories(d.memories || []));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { toast.error('Failed to save'); return; }
      toast.success('Settings saved!');
      router.refresh();
    } finally { setSaving(false); }
  };

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    setAddingMemory(true);
    try {
      const res = await fetch('/api/memories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: newMemory.trim() }) });
      if (!res.ok) { toast.error('Failed to add memory'); return; }
      const { memory } = await res.json();
      setMemories(p => [memory, ...p]);
      setNewMemory('');
      toast.success('Memory saved!');
    } finally { setAddingMemory(false); }
  };

  const deleteMemory = async (id: string) => {
    await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    setMemories(p => p.filter(m => m.id !== id));
    toast.success('Removed');
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
  };

  return (
    <div className="page" style={{ paddingBottom: '80px', maxWidth: '560px' }}>
      <div style={{ marginBottom: '24px' }}><h1 style={{ fontSize: '24px', fontWeight: 700 }}>Settings</h1><p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', marginTop: '2px' }}>Manage your account and preferences</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><User size={15} color="hsl(205, 90%, 60%)" /><h2 style={{ fontWeight: 600, fontSize: '15px' }}>Profile</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Display Name</label><input value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} /></div>
            <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Full Name</label><input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Email</label><input value={profile?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} /></div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>Default AI Mode</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {MODES.map(m => <button key={m.v} onClick={() => setForm(p => ({ ...p, assistant_mode: m.v }))} style={{ padding: '9px', borderRadius: '10px', border: `1px solid ${form.assistant_mode === m.v ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 16%)'}`, background: form.assistant_mode === m.v ? 'hsl(205 90% 48% / 0.1)' : 'transparent', color: form.assistant_mode === m.v ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 60%)', fontSize: '12px', cursor: 'pointer' }}>{m.l}</button>)}
          </div>
        </div>

        {/* AI Memory */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Brain size={15} color="hsl(262, 83%, 75%)" />
            <h2 style={{ fontWeight: 600, fontSize: '15px' }}>AI Memory</h2>
          </div>
          <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', marginBottom: '14px' }}>Facts Omnia remembers about you — injected into every conversation.</p>

          {/* Add new memory */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              value={newMemory}
              onChange={e => setNewMemory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addMemory()}
              placeholder="e.g. I'm a freelance developer based in London"
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
            />
            <button
              onClick={addMemory}
              disabled={addingMemory || !newMemory.trim()}
              style={{ padding: '8px 14px', borderRadius: '8px', background: 'hsl(262 83% 58%)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, flexShrink: 0, opacity: addingMemory || !newMemory.trim() ? 0.5 : 1 }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Memory list */}
          {memories.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'hsl(240 5% 45%)', textAlign: 'center', padding: '16px 0' }}>No memories yet. Add facts about yourself above.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {memories.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 14%)' }}>
                  <span style={{ flex: 1, fontSize: '13px', color: 'hsl(0 0% 80%)', lineHeight: 1.5 }}>{m.content}</span>
                  <button onClick={() => deleteMemory(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', display: 'flex', padding: '2px', flexShrink: 0, touchAction: 'manipulation' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Bell size={15} color="hsl(205, 90%, 60%)" /><h2 style={{ fontWeight: 600, fontSize: '15px' }}>Notifications</h2></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><p style={{ fontSize: '14px', fontWeight: 500 }}>Email Notifications</p><p style={{ fontSize: '12px', color: 'hsl(240 5% 55%)' }}>Receive reminders and updates by email</p></div>
            <button onClick={() => setForm(p => ({ ...p, email_notifications: !p.email_notifications }))} style={{ width: '42px', height: '24px', borderRadius: '999px', background: form.email_notifications ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 20%)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', left: form.email_notifications ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ height: '44px', fontSize: '15px', fontWeight: 600 }}>{saving ? 'Saving…' : 'Save Changes'}</button>

        <div className="card" style={{ padding: '16px' }}>
          <button onClick={signOut} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', color: 'hsl(240 5% 60%)', height: '40px' }}><LogOut size={15} /> Sign Out</button>
        </div>
      </div>
    </div>
  );
}
