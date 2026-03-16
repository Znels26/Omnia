'use client';
import { useState } from 'react';
import { FileOutput, Sparkles, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const FORMATS = [
  { value: 'pdf', label: '📄 PDF' },
  { value: 'docx', label: '📝 Word' },
  { value: 'xlsx', label: '📊 Excel' },
  { value: 'pptx', label: '📋 PowerPoint' },
  { value: 'md', label: '📃 Markdown' },
  { value: 'txt', label: '📃 Text' },
];

export function DocBuilderView({ profile }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState('pdf');
  const [aiTopic, setAiTopic] = useState('');
  const [aiType, setAiType] = useState('report');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<'write' | 'ai'>('write');

  const aiGenerate = async () => {
    if (!aiTopic.trim()) { toast.error('Enter a topic'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/exports/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: aiType, topic: aiTopic }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Generation failed'); return; }
      setContent(d.content);
      if (!title) setTitle(aiTopic);
      setTab('write');
      toast.success('Content generated!');
    } finally { setGenerating(false); }
  };

  const exportDoc = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Add title and content first'); return; }
    setExporting(true);
    try {
      const res = await fetch('/api/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, format }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Export failed'); return; }
      const dlRes = await fetch(`/api/exports/${d.export.id}/download`);
      if (dlRes.ok) {
        const blob = await dlRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${title}.${format}`; a.click();
        URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} exported!`);
      }
    } finally { setExporting(false); }
  };

  return (
    <div className="page">
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Document Builder</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', background: 'hsl(240 6% 11%)', borderRadius: '10px', padding: '3px', marginBottom: '16px', gap: '2px' }}>
            {(['write', 'ai'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: tab === t ? 'hsl(240 8% 7%)' : 'transparent', color: tab === t ? 'hsl(0 0% 90%)' : 'hsl(240 5% 55%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {t === 'ai' && <Sparkles size={13} />}
                {t === 'write' ? 'Write Manually' : 'AI Generate'}
              </button>
            ))}
          </div>

          {tab === 'ai' ? (
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', display: 'block', marginBottom: '5px' }}>Document Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['report', 'summary', 'outline', 'proposal', 'meeting_notes', 'action_plan'].map(t => (
                    <button key={t} onClick={() => setAiType(t)} style={{ padding: '7px', borderRadius: '8px', border: `1px solid ${aiType === t ? 'hsl(205 90% 48%)' : 'hsl(240 6% 20%)'}`, background: aiType === t ? 'hsl(205 90% 48% / 0.1)' : 'transparent', color: aiType === t ? 'hsl(205,90%,60%)' : 'hsl(240 5% 60%)', cursor: 'pointer', fontSize: '12px', textTransform: 'capitalize' }}>{t.replace('_',' ')}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', display: 'block', marginBottom: '5px' }}>Topic / Title *</label>
                <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. Q4 Marketing Strategy for SaaS" />
              </div>
              <button onClick={aiGenerate} disabled={generating || !aiTopic.trim()} className="btn btn-primary" style={{ height: '44px' }}>
                {generating ? <><RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} />Generating…</> : <><Sparkles size={15} />Generate Content</>}
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: '16px' }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title…" style={{ fontSize: '17px', fontWeight: 600, marginBottom: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid hsl(240 6% 16%)', borderRadius: 0, padding: '0 0 10px' }} />
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={18} placeholder={'Start writing…

# Section Heading
## Subsection
- Bullet point
**Bold** and *italic*'} style={{ resize: 'none', fontFamily: 'ui-monospace, monospace', fontSize: '13px', background: 'transparent', border: 'none', outline: 'none', width: '100%', color: 'hsl(0 0% 85%)' }} />
            </div>
          )}

          {content && <p style={{ marginTop: '8px', fontSize: '12px', color: 'hsl(240 5% 45%)' }}>{content.split(/\s+/).filter(Boolean).length} words · {content.length} characters</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <h2 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Export Format</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {FORMATS.map(f => (
                <button key={f.value} onClick={() => setFormat(f.value)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 11px', borderRadius: '9px', border: `1px solid ${format === f.value ? 'hsl(205 90% 48%)' : 'hsl(240 6% 20%)'}`, background: format === f.value ? 'hsl(205 90% 48% / 0.08)' : 'transparent', cursor: 'pointer', fontSize: '13px', color: format === f.value ? 'hsl(205,90%,60%)' : 'hsl(0 0% 75%)', textAlign: 'left' }}>
                  {f.label}
                  {format === f.value && <div style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: 'hsl(205 90% 48%)' }} />}
                </button>
              ))}
            </div>
            <button onClick={exportDoc} disabled={exporting || !title.trim() || !content.trim()} className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
              {exporting ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />Exporting…</> : <><Download size={14} />Export {format.toUpperCase()}</>}
            </button>
          </div>

          <div className="card" style={{ padding: '14px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: '8px' }}>💡 Tips</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {['Use # headers for structure', 'AI generates first drafts', 'PPTX splits at headings', 'Excel works with table data'].map(t => (
                <li key={t} style={{ fontSize: '12px', color: 'hsl(240 5% 55%)', display: 'flex', gap: '5px' }}>· {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
