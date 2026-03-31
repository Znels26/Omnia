'use client';
import { useState } from 'react';
import { Wand2, Copy, Star, Trash2, RefreshCw, Check, Hash, MessageSquare, FileText, PenTool } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

const TYPES = [
  { v: 'caption', l: 'Caption', icon: Hash },
  { v: 'social_post', l: 'Social Post', icon: MessageSquare },
  { v: 'blog_draft', l: 'Blog Draft', icon: FileText },
  { v: 'script', l: 'Script', icon: PenTool },
  { v: 'rewrite', l: 'Rewrite', icon: RefreshCw },
  { v: 'tone_change', l: 'Tone Change', icon: Wand2 },
];
const PLATFORMS = ['Instagram','Twitter/X','LinkedIn','TikTok','Facebook','YouTube','Newsletter','Blog'];
const TONES = ['Professional','Casual','Funny','Inspiring','Educational','Persuasive','Bold'];

export function ContentView({ profile, initialItems }: any) {
  const [items, setItems] = useState(initialItems);
  const [type, setType] = useState('caption');
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('');
  const [tone, setTone] = useState('');
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState<string|null>(null);
  const [favOnly, setFavOnly] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) { toast.error('Enter a prompt'); return; }
    setGenerating(true); setOutput('');
    try {
      const res = await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, prompt, platform, tone }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Generation failed'); return; }
      setOutput(d.item.output);
      setItems((p: any[]) => [d.item, ...p]);
      toast.success('Generated!');
    } finally { setGenerating(false); }
  };

  const copy = async (text: string, id?: string) => {
    await navigator.clipboard.writeText(text);
    if (id) setCopied(id); setTimeout(() => setCopied(null), 2000); toast.success('Copied!');
  };

  const fav = async (item: any) => {
    await fetch(`/api/content/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_favorite: !item.is_favorite }) });
    setItems((p: any[]) => p.map(i => i.id === item.id ? { ...i, is_favorite: !i.is_favorite } : i));
  };

  const del = async (id: string) => {
    await fetch(`/api/content/${id}`, { method: 'DELETE' });
    setItems((p: any[]) => p.filter(i => i.id !== id));
  };

  const shown = favOnly ? items.filter((i: any) => i.is_favorite) : items;

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <style>{`
        .content-studio-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
        .cs-type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        @media(max-width:768px){
          .content-studio-grid{grid-template-columns:1fr}
          .cs-type-grid{grid-template-columns:repeat(2,1fr)}
        }
      `}</style>
      <div style={{ marginBottom: '24px' }}><h1 style={{ fontSize: '24px', fontWeight: 700 }}>Content Studio</h1><p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', marginTop: '2px' }}>Generate captions, posts, blogs, scripts with AI</p></div>
      <div className="content-studio-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="cs-type-grid">
            {TYPES.map(t => (
              <button key={t.v} onClick={() => setType(t.v)} style={{ padding: '10px 8px', borderRadius: '10px', border: `1px solid ${type === t.v ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 16%)'}`, background: type === t.v ? 'hsl(205 90% 48% / 0.1)' : 'transparent', color: type === t.v ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 60%)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
                <t.icon size={15} />{t.l}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ height: '36px', fontSize: '13px' }}><option value="">Any</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select>
            </div>
            <div><label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Tone</label>
              <select value={tone} onChange={e => setTone(e.target.value)} style={{ height: '36px', fontSize: '13px' }}><option value="">Any</option>{TONES.map(t => <option key={t}>{t}</option>)}</select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px' }}>Your prompt</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder={type === 'rewrite' ? 'Paste text to rewrite…' : 'Describe what to create…'} style={{ resize: 'none' }} />
          </div>
          <button onClick={generate} disabled={generating || !prompt.trim()} className="btn btn-primary" style={{ height: '44px', fontSize: '15px' }}>
            {generating ? <><RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating…</> : <><Wand2 size={15} /> Generate</>}
          </button>
          {output && (
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(205, 90%, 60%)' }}>Generated</span>
                <button onClick={() => copy(output)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '7px', background: 'hsl(205 90% 48% / 0.1)', border: 'none', cursor: 'pointer', color: 'hsl(205, 90%, 60%)', fontSize: '12px' }}><Copy size={12} /> Copy</button>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{output}</p>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Saved ({items.length})</h2>
            <button onClick={() => setFavOnly(!favOnly)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', background: favOnly ? 'rgba(251,191,36,0.15)' : 'transparent', border: `1px solid ${favOnly ? '#fbbf24' : 'hsl(240 6% 16%)'}`, cursor: 'pointer', color: favOnly ? '#fbbf24' : 'hsl(240 5% 55%)', fontSize: '12px' }}>
              <Star size={12} /> {favOnly ? 'All' : 'Favorites'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100dvh - 300px)', overflowY: 'auto' }}>
            {shown.length === 0 ? <div className="empty" style={{ padding: '40px 20px' }}><Wand2 size={28} color="hsl(240 5% 35%)" /><p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)' }}>{favOnly ? 'No favorites' : 'Nothing generated yet'}</p></div> :
              shown.map((item: any) => (
                <div key={item.id} className="card" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.12)', color: 'hsl(205, 90%, 60%)', fontWeight: 600 }}>{item.type?.replace('_',' ')}</span>
                    {item.platform && <span style={{ fontSize: '10px', color: 'hsl(240 5% 50%)' }}>{item.platform}</span>}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                      <button onClick={() => copy(item.output, item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'hsl(240 5% 55%)', display: 'flex' }}>{copied === item.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}</button>
                      <button onClick={() => fav(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', display: 'flex', color: item.is_favorite ? '#fbbf24' : 'hsl(240 5% 55%)' }}><Star size={12} fill={item.is_favorite ? '#fbbf24' : 'none'} /></button>
                      <button onClick={() => del(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'hsl(240 5% 55%)', display: 'flex' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'hsl(240 5% 60%)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.output}</p>
                  <p style={{ fontSize: '10px', color: 'hsl(240 5% 40%)', marginTop: '6px' }}>{timeAgo(item.created_at)}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
