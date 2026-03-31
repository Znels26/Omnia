'use client';
import { useState, useEffect } from 'react';
import { User, Bell, LogOut, Brain, Plus, Trash2, Zap, Upload, Github, Eye, EyeOff, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { MemoryImport } from '@/components/features/autopilot/MemoryImport';

function ToggleRow({ label, desc, on, onChange, small }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void; small?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div>
        <p style={{ fontSize: small ? '13px' : '14px', fontWeight: 500, margin: 0 }}>{label}</p>
        <p style={{ fontSize: '12px', color: 'hsl(240 5% 55%)', margin: 0 }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!on)}
        style={{ width: '42px', height: '24px', borderRadius: '999px', background: on ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 20%)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
      >
        <span style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', left: on ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  );
}

const MODES = [{ v: 'general', l: '✨ General' }, { v: 'productivity', l: '⚡ Productivity' }, { v: 'writing', l: '✍️ Writing' }, { v: 'study', l: '📚 Study' }, { v: 'planning', l: '🎯 Planning' }, { v: 'documents', l: '📄 Documents' }];

export function SettingsView({ profile }: any) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name:           profile?.display_name || '',
    full_name:              profile?.full_name || '',
    assistant_mode:         profile?.assistant_mode || 'general',
    email_notifications:    profile?.email_notifications ?? true,
    push_notifications:     profile?.push_notifications ?? true,
    push_reminders:         profile?.push_reminders ?? true,
    push_morning_briefing:  profile?.push_morning_briefing ?? true,
    push_streak_alerts:     profile?.push_streak_alerts ?? true,
    push_goal_reminders:    profile?.push_goal_reminders ?? true,
    push_invoice_alerts:    profile?.push_invoice_alerts ?? true,
  });
  const [memories, setMemories] = useState<any[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [githubToken, setGithubToken] = useState(profile?.github_token ? '••••••••••••••••' : '');
  const [githubTokenEditing, setGithubTokenEditing] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [savingGithub, setSavingGithub] = useState(false);
  const [githubSaved, setGithubSaved] = useState(!!profile?.github_token);
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

  const saveGithubToken = async () => {
    if (!githubToken.trim() || githubToken.includes('•')) return;
    setSavingGithub(true);
    try {
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ github_token: githubToken.trim() }) });
      if (!res.ok) { toast.error('Failed to save GitHub token'); return; }
      toast.success('GitHub connected!');
      setGithubSaved(true);
      setGithubTokenEditing(false);
      setGithubToken('••••••••••••••••');
    } finally { setSavingGithub(false); }
  };

  const disconnectGithub = async () => {
    setSavingGithub(true);
    try {
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ github_token: null }) });
      if (!res.ok) { toast.error('Failed to disconnect'); return; }
      toast.success('GitHub disconnected');
      setGithubSaved(false);
      setGithubToken('');
      setGithubTokenEditing(false);
    } finally { setSavingGithub(false); }
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
            {MODES.map(m => <button key={m.v} onClick={() => setForm(p => ({ ...p, assistant_mode: m.v }))} style={{ padding: '9px', borderRadius: '10px', border: `1px solid ${form.assistant_mode === m.v ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 16%)'}`, background: form.assistant_mode === m.v ? 'hsl(205 90% 48% / 0.1)' : 'transparent', color: form.assistant_mode === m.v ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 60%)', fontSize: '12px', cursor: 'pointer', textAlign: 'center' }}>{m.l}</button>)}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Bell size={15} color="hsl(205, 90%, 60%)" /><h2 style={{ fontWeight: 600, fontSize: '15px' }}>Notifications</h2></div>

          {/* Email master toggle */}
          <ToggleRow
            label="Email Notifications"
            desc="Reminders and briefings by email"
            on={form.email_notifications}
            onChange={v => setForm(p => ({ ...p, email_notifications: v }))}
          />

          <div style={{ height: '1px', background: 'hsl(240 6% 14%)', margin: '14px 0' }} />

          {/* Push master toggle */}
          <ToggleRow
            label="Push Notifications"
            desc="Instant alerts on this device"
            on={form.push_notifications}
            onChange={v => setForm(p => ({ ...p, push_notifications: v }))}
          />

          {/* Push sub-toggles — only show when push is on */}
          {form.push_notifications && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '8px', borderLeft: '2px solid hsl(240 6% 16%)' }}>
              <ToggleRow label="Reminders"        desc="Push at exact reminder time"         on={form.push_reminders}        onChange={v => setForm(p => ({ ...p, push_reminders: v }))}        small />
              <ToggleRow label="Morning Briefing" desc="Daily summary at 7am"                on={form.push_morning_briefing} onChange={v => setForm(p => ({ ...p, push_morning_briefing: v }))} small />
              <ToggleRow label="Streak Alerts"    desc="Nudge when streak is at risk"        on={form.push_streak_alerts}    onChange={v => setForm(p => ({ ...p, push_streak_alerts: v }))}    small />
              <ToggleRow label="Goal Reminders"   desc="7-day deadline warnings"             on={form.push_goal_reminders}   onChange={v => setForm(p => ({ ...p, push_goal_reminders: v }))}   small />
              <ToggleRow label="Invoice Alerts"   desc="Notify when an invoice is paid"      on={form.push_invoice_alerts}   onChange={v => setForm(p => ({ ...p, push_invoice_alerts: v }))}   small />
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ height: '44px', fontSize: '15px', fontWeight: 600 }}>{saving ? 'Saving…' : 'Save Changes'}</button>

        {/* Autopilot */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Zap size={15} color="hsl(205,90%,60%)" />
            <h2 style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>Autopilot</h2>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.15)', color: 'hsl(205,90%,60%)' }}>NEW</span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'hsl(240 5% 50%)', marginBottom: '14px', lineHeight: 1.6 }}>
            Your AI Chief of Staff — works overnight so you wake up to a done list. Configure your persona, permission level, and what Omnia does for you automatically.
          </p>
          <Link href="/autopilot" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.25)', borderRadius: '9px', color: 'hsl(205,90%,60%)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            <Zap size={13} /> Manage Autopilot →
          </Link>
        </div>

        {/* Import & Migration */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Upload size={15} color="hsl(262,83%,75%)" />
            <h2 style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>Import & Migration</h2>
          </div>
          {!showImport ? (
            <>
              <p style={{ fontSize: '12.5px', color: 'hsl(240 5% 50%)', marginBottom: '14px', lineHeight: 1.6 }}>
                Upload your ChatGPT, Claude, or Gemini conversation history. Omnia will automatically extract your goals, tasks, habits, and personal facts — so it knows you from the first message.
              </p>
              <button
                onClick={() => setShowImport(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'hsl(262 83% 58% / 0.1)', border: '1px solid hsl(262 83% 58% / 0.25)', borderRadius: '9px', color: 'hsl(262,83%,75%)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Upload size={13} /> Import Conversation History
              </button>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p style={{ fontSize: '12.5px', color: 'hsl(240 5% 50%)', margin: 0 }}>Upload your ChatGPT, Claude or Gemini history</p>
                <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', fontSize: '12px', padding: '2px 6px' }}>✕ Close</button>
              </div>
              <MemoryImport onComplete={() => setShowImport(false)} compact />
            </div>
          )}
        </div>

        {/* GitHub Integration */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Github size={15} color="hsl(240 5% 70%)" />
            <h2 style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>GitHub</h2>
            {githubSaved && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'hsl(142 70% 40% / 0.15)', color: 'hsl(142,70%,60%)' }}>
                <Check size={9} /> Connected
              </span>
            )}
          </div>
          <p style={{ fontSize: '12.5px', color: 'hsl(240 5% 50%)', marginBottom: '14px', lineHeight: 1.6 }}>
            Connect GitHub to push your Code Studio projects directly to a repo with one click.{' '}
            <a href="https://github.com/settings/tokens/new?scopes=repo&description=Omnia+Code+Studio" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(205,90%,60%)', textDecoration: 'none' }}>
              Generate a token →
            </a>
          </p>
          {githubSaved && !githubTokenEditing ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setGithubToken(''); setGithubTokenEditing(true); setGithubSaved(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'hsl(240 6% 12%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '9px', color: 'hsl(240 5% 65%)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Update Token
              </button>
              <button onClick={disconnectGithub} disabled={savingGithub} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'transparent', border: '1px solid hsl(0 70% 50% / 0.3)', borderRadius: '9px', color: 'hsl(0,70%,65%)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: savingGithub ? 0.5 : 1 }}>
                Disconnect
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showGithubToken ? 'text' : 'password'}
                  value={githubToken.includes('•') ? '' : githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  style={{ width: '100%', fontSize: '13px', padding: '8px 36px 8px 12px', fontFamily: 'ui-monospace, monospace' }}
                />
                <button onClick={() => setShowGithubToken(v => !v)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', display: 'flex', padding: '2px' }}>
                  {showGithubToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={saveGithubToken}
                disabled={savingGithub || !githubToken.trim() || githubToken.includes('•')}
                style={{ padding: '8px 16px', background: 'hsl(142 70% 40% / 0.15)', border: '1px solid hsl(142 70% 40% / 0.3)', borderRadius: '9px', color: 'hsl(142,70%,60%)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: savingGithub || !githubToken.trim() ? 0.5 : 1 }}
              >
                {savingGithub ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <button onClick={signOut} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', color: 'hsl(240 5% 60%)', height: '40px' }}><LogOut size={15} /> Sign Out</button>
        </div>
      </div>
    </div>
  );
}
