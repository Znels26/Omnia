'use client';
import { useState, useCallback } from 'react';
import { Plus, Search, Pin, Trash2, Sparkles, Save, X, FileText, ArrowLeft } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

export function NotesView({ profile, initialNotes, initialFolders }: any) {
  const [notes, setNotes] = useState(initialNotes);
  const [active, setActive] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  // Mobile: 'list' shows sidebar, 'editor' shows editor panel
  const [mobilePanel, setMobilePanel] = useState<'list' | 'editor'>('list');

  const filtered = notes.filter((n: any) =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered.filter((n: any) => n.is_pinned);
  const regular = filtered.filter((n: any) => !n.is_pinned);

  const save = useCallback(async (id: string, t: string, c: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, content: c, content_preview: c.replace(/[#*`]/g, '').trim().slice(0, 200), word_count: c.split(/\s+/).filter(Boolean).length }) });
      if (res.ok) { const { note } = await res.json(); setNotes((p: any[]) => p.map(n => n.id === id ? note : n)); }
    } finally { setSaving(false); }
  }, []);

  const select = (note: any) => {
    if (active && (title !== active.title || content !== active.content)) save(active.id, title, content);
    setActive(note); setTitle(note.title || ''); setContent(note.content || '');
    setMobilePanel('editor');
  };

  const newNote = async () => {
    const res = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Untitled Note', content: '' }) });
    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return; }
    const { note } = await res.json();
    setNotes((p: any[]) => [note, ...p]);
    setActive(note); setTitle(note.title); setContent('');
    setMobilePanel('editor');
  };

  const pin = async (id: string, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/notes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_pinned: !isPinned }) });
    setNotes((p: any[]) => p.map(n => n.id === id ? { ...n, is_pinned: !isPinned } : n));
  };

  const del = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes((p: any[]) => p.filter(n => n.id !== id));
    if (active?.id === id) { setActive(null); setTitle(''); setContent(''); setMobilePanel('list'); }
  };

  const summarize = async () => {
    if (!active || !content) { toast.error('Add content first'); return; }
    setSummarizing(true);
    try {
      const res = await fetch(`/api/notes/${active.id}/summarize`, { method: 'POST' });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return; }
      const { note } = await res.json();
      setNotes((p: any[]) => p.map(n => n.id === note.id ? note : n));
      setActive(note);
      toast.success('Summary ready!');
    } finally { setSummarizing(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div
        style={{ width: '260px', borderRight: '1px solid hsl(240 6% 14%)', display: 'flex', flexDirection: 'column', background: 'hsl(240 10% 4%)', flexShrink: 0 }}
        className={`notes-sidebar${mobilePanel === 'editor' ? ' notes-mobile-hidden' : ''}`}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ paddingLeft: '28px', paddingRight: '8px', height: '34px', fontSize: '13px' }} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex' }}><X size={12} /></button>}
          </div>
          <button onClick={newNote} style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'hsl(205 90% 48% / 0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation' }}><Plus size={15} color="hsl(205, 90%, 60%)" /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px', overscrollBehavior: 'contain' }}>
          {pinned.length > 0 && <>
            <p style={{ padding: '6px 8px 4px', fontSize: '10px', color: 'hsl(240 5% 45%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pinned</p>
            {pinned.map((n: any) => <NoteItem key={n.id} note={n} active={active?.id === n.id} onSelect={() => select(n)} onPin={(e: any) => pin(n.id, n.is_pinned, e)} onDelete={() => del(n.id)} />)}
          </>}
          {regular.map((n: any) => <NoteItem key={n.id} note={n} active={active?.id === n.id} onSelect={() => select(n)} onPin={(e: any) => pin(n.id, n.is_pinned, e)} onDelete={() => del(n.id)} />)}
          {filtered.length === 0 && (
            <div className="empty" style={{ padding: '32px 16px' }}>
              <FileText size={28} color="hsl(240 5% 35%)" />
              <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)' }}>{search ? 'No results' : 'No notes yet'}</p>
              {!search && <button onClick={newNote} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205, 90%, 60%)', fontSize: '12px', touchAction: 'manipulation' }}>Create one</button>}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        className={mobilePanel === 'list' ? 'notes-editor notes-mobile-hidden' : 'notes-editor'}
      >
        {active ? (
          <>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {/* Back button - mobile only */}
              <button onClick={() => setMobilePanel('list')} className="notes-back-btn" style={{ display: 'none', padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 60%)', flexShrink: 0, touchAction: 'manipulation' }}>
                <ArrowLeft size={18} />
              </button>
              <input value={title} onChange={e => setTitle(e.target.value)} onBlur={() => save(active.id, title, content)} style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 600, outline: 'none', padding: 0, color: 'hsl(0 0% 90%)', minWidth: 0 }} placeholder="Note title" />
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                {saving && <span style={{ fontSize: '11px', color: 'hsl(240 5% 50%)' }}>Saving…</span>}
                <button onClick={summarize} disabled={summarizing} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '8px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.2)', color: 'hsl(205, 90%, 60%)', fontSize: '12px', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap', touchAction: 'manipulation' }}>
                  <Sparkles size={12} />{summarizing ? 'Summarizing…' : 'AI Summary'}
                </button>
                <button onClick={() => save(active.id, title, content)} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', display: 'flex', touchAction: 'manipulation' }}><Save size={15} /></button>
                <button onClick={() => del(active.id)} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', display: 'flex', touchAction: 'manipulation' }}><Trash2 size={15} /></button>
              </div>
            </div>
            {active.ai_summary && (
              <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: '10px', background: 'hsl(205 90% 48% / 0.06)', border: '1px solid hsl(205 90% 48% / 0.15)', flexShrink: 0 }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(205, 90%, 60%)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} /> AI Summary</p>
                <p style={{ fontSize: '13px', color: 'hsl(240 5% 65%)', lineHeight: 1.5 }}>{active.ai_summary}</p>
              </div>
            )}
            <textarea value={content} onChange={e => setContent(e.target.value)} onBlur={() => save(active.id, title, content)} placeholder="Start writing…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', padding: '16px', fontSize: '14px', lineHeight: 1.7, fontFamily: 'ui-monospace, monospace', color: 'hsl(0 0% 85%)' }} />
            <div style={{ padding: '8px 16px', borderTop: '1px solid hsl(240 6% 14%)', display: 'flex', gap: '12px', fontSize: '11px', color: 'hsl(240 5% 45%)', flexShrink: 0 }}>
              <span>{content.split(/\s+/).filter(Boolean).length} words</span>
              <span>{content.length} chars</span>
              <span>Edited {timeAgo(active.updated_at)}</span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'hsl(240 6% 11%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={24} color="hsl(240 5% 45%)" /></div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>No note selected</h2>
              <p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>Select a note or create a new one</p>
            </div>
            <button onClick={newNote} className="btn btn-primary" style={{ touchAction: 'manipulation' }}><Plus size={15} /> New Note</button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .notes-sidebar { width: 100% !important; border-right: none !important; }
          .notes-mobile-hidden { display: none !important; }
          .notes-editor { width: 100% !important; }
          .notes-back-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function NoteItem({ note, active, onSelect, onPin, onDelete }: any) {
  return (
    <div onClick={onSelect} style={{ padding: '9px 10px', borderRadius: '8px', cursor: 'pointer', background: active ? 'hsl(205 90% 48% / 0.1)' : 'transparent', transition: 'background 0.15s', marginBottom: '2px', touchAction: 'manipulation' }} className="note-item">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: active ? 'hsl(205, 90%, 70%)' : 'hsl(0 0% 80%)' }}>{note.title || 'Untitled'}</p>
        <div style={{ display: 'flex', gap: '2px', opacity: 0 }} className="note-actions">
          <button onClick={onPin} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: note.is_pinned ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 50%)', display: 'flex', touchAction: 'manipulation' }}><Pin size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'hsl(240 5% 50%)', display: 'flex', touchAction: 'manipulation' }}><Trash2 size={10} /></button>
        </div>
      </div>
      <p style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{note.content_preview || 'Empty note'}</p>
      <p style={{ fontSize: '10px', color: 'hsl(240 5% 40%)', marginTop: '3px' }}>{timeAgo(note.updated_at)}</p>
    </div>
  );
}
