'use client';
import { useState } from 'react';
import { FileOutput, Download, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const FORMATS = [
  { v: 'pdf', l: 'PDF', icon: '📄' },
  { v: 'docx', l: 'Word', icon: '📝' },
  { v: 'xlsx', l: 'Excel', icon: '📊' },
  { v: 'pptx', l: 'PowerPoint', icon: '📋' },
  { v: 'md', l: 'Markdown', icon: '📃' },
  { v: 'txt', l: 'Text', icon: '📃' },
];

export function DocumentBuilderView({ profile }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiType, setAiType] = useState('report');
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<'write'|'ai'>('write');

  const generate = async () => {
    if (!aiTopic.trim()) { toast.error('Enter a topic'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/exports/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: aiType, topic: aiTopic }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Failed'); return; }
      setContent(d.content);
      if (!title) setTitle(aiTopic);
      setTab('write');
      toast.success('Content generated!');
    } finally { setGenerating(false); }
  };

  const exportDoc = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Add a title and content'); return; }
    setExporting(true);
    try {
      const res = await fetch('/api/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, format }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Export failed'); return; }
      const dlRes = await fetch(`/api/exports/${d.export.id}/download`);
      if (dlRes.ok) {
        const blob = await dlRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${title}.${format}`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Downloaded!');
      }
    } finally { setExporting(false); }
  };

  return (
    <div className="page" style={{ paddingBottom: '80px', maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}><h1 style={{ fontSize: '24px', fontWeight: 700 }}>Document Builder</h1><p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', marginTop: '2px' }}>Create and export documents in any format</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', background: 'hsl(240 6% 9%)', borderRadius: '10px', padding: '4px', marginBottom: '16px' }}>
            {[{ v: 'write', l: 'Write' }, { v: 'ai', l: '✨ AI Generate' }].map(t => (
              <button key={t.v} onClick={() => setTab(t.v as any)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: tab === t.v ? 'hsl(240 8% 7%)' : 'transparent', color: tab === t.v ? 'hsl(0 0% 88%)' : 'hsl(240 5% 55%)' }}>{t.l}</button>
            ))}
          </div>

          {tab === 'ai' ? (
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '14px' }}>Generate with AI</h3>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '6px' }}>Document Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['report','summary','outline','proposal','meeting_notes','action_plan'].map(t => (
                    <button key={t} onClick={() => setAiType(t)} style={{ padding: '7px', borderRadius: '8px', border: `1px solid ${aiType === t ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 16%)'}`, background: aiType === t ? 'hsl(205 90% 48% / 0.1)' : 'transparent', color: aiType === t ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 60%)', fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize' }}>{t.replace('_',' ')}</button>
                  ))}
                </div>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '6px' }}>Topic *</label><input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. Q4 Marketing Strategy" /></div>
              <button onClick={generate} disabled={generating || !aiTopic.trim()} className="btn btn-primary" style={{ height: '42px' }}>
                {generating ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</> : <><Sparkles size={14} /> Generate Content</>}
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title…" style={{ fontSize: '16px', fontWeight: 600, background: 'transparent', border: 'none', borderBottom: '1px solid hsl(240 6% 16%)', borderRadius: 0, paddingLeft: 0 }} />
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={18} placeholder="Start writing or use AI Generate…" style={{ resize: 'none', fontFamily: 'ui-monospace, monospace', fontSize: '13px', lineHeight: 1.7 }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ padding: '18px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px' }}>Export Format</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {FORMATS.map(f => (
                <button key={f.v} onClick={() => setFormat(f.v)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', border: `1px solid ${format === f.v ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 16%)'}`, background: format === f.v ? 'hsl(205 90% 48% / 0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                  <span style={{ fontSize: '18px' }}>{f.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: format === f.v ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 70%)' }}>{f.l}</span>
                  {format === f.v && <div style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: 'hsl(205, 90%, 48%)' }} />}
                </button>
              ))}
            </div>
            <button onClick={exportDoc} disabled={exporting || !title.trim() || !content.trim()} className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
              {exporting ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Exporting…</> : <><Download size={14} /> Export as {format.toUpperCase()}</>}
            </button>
          </div>
          <div className="card" style={{ padding: '14px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(240 5% 55%)', marginBottom: '8px' }}>💡 Tips</p>
            <ul style={{ fontSize: '12px', color: 'hsl(240 5% 55%)', lineHeight: 1.6, paddingLeft: '14px', margin: 0 }}>
              <li>Use # headers for sections</li>
              <li>AI splits PPTX at headings</li>
              <li>XLSX works best with tables</li>
              <li>Try AI Generate for first draft</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
