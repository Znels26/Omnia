'use client';
import { useState } from 'react';
import { FileText, Sparkles, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const TONES = ['Professional', 'Friendly', 'Bold', 'Concise'];
const PROJECT_TYPES = ['Web Development', 'Mobile App', 'Design', 'Marketing', 'Consulting', 'Content', 'SEO', 'Other'];

function renderMarkdown(text: string) {
  if (!text) return '';
  return text
    .replace(/^# (.*)/gm, '<h1 style="font-size:22px;font-weight:800;margin:20px 0 10px;letter-spacing:-0.03em">$1</h1>')
    .replace(/^## (.*)/gm, '<h2 style="font-size:16px;font-weight:700;margin:18px 0 8px;color:hsl(205,90%,60%)">$1</h2>')
    .replace(/^### (.*)/gm, '<h3 style="font-size:14px;font-weight:700;margin:12px 0 6px">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/^(\d+)\. (.*)/gm, '<li style="margin:4px 0;padding-left:4px">$2</li>')
    .replace(/(<li.*<\/li>\n?)+/g, s => `<ul style="padding-left:20px;margin:8px 0">${s}</ul>`)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export function ProposalView({ profile }: any) {
  const [form, setForm] = useState({
    yourName: profile?.display_name || profile?.full_name || '',
    yourCompany: '',
    clientName: '',
    clientCompany: '',
    projectType: 'Web Development',
    description: '',
    deliverables: '',
    timeline: '',
    budget: '',
    tone: 'Professional',
  });
  const [output, setOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const generate = async () => {
    if (!form.clientName.trim() || !form.description.trim()) {
      toast.error('Client name and project description are required');
      return;
    }
    setOutput('');
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Generation failed'); return; }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6);
          if (d === '[DONE]') continue;
          try {
            const p = JSON.parse(d);
            if (p.token) { acc += p.token; setOutput(acc); }
            if (p.error) toast.error(p.error);
          } catch {}
        }
      }
    } catch { toast.error('Connection error'); }
    finally { setGenerating(false); }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Proposal copied!');
  };

  const label = (txt: string) => (
    <label style={{ display: 'block', fontSize: '12px', color: 'hsl(240 5% 55%)', marginBottom: '5px', fontWeight: 500 }}>{txt}</label>
  );

  return (
    <div className="page" style={{ maxWidth: '820px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Proposal Generator</h1>
          <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', marginTop: '2px' }}>AI-written proposals in seconds — ready to send</p>
        </div>
        {output && (
          <button onClick={copy} className="btn btn-outline" style={{ gap: '8px', flexShrink: 0 }}>
            {copied ? <><Check size={14} color="#34d399" /> Copied</> : <><Copy size={14} /> Copy Proposal</>}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: output ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }} className="proposal-grid">
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px', color: 'hsl(240 5% 70%)' }}>YOUR INFO</h2>
            <div className="prop-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>{label('Your Name')}<input value={form.yourName} onChange={e => f('yourName', e.target.value)} placeholder="Jane Smith" /></div>
              <div>{label('Your Company')}<input value={form.yourCompany} onChange={e => f('yourCompany', e.target.value)} placeholder="Smith Agency" /></div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px', color: 'hsl(240 5% 70%)' }}>CLIENT INFO</h2>
            <div className="prop-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>{label('Client Name *')}<input value={form.clientName} onChange={e => f('clientName', e.target.value)} placeholder="John Doe" /></div>
              <div>{label('Client Company')}<input value={form.clientCompany} onChange={e => f('clientCompany', e.target.value)} placeholder="Acme Inc." /></div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '14px', color: 'hsl(240 5% 70%)' }}>PROJECT DETAILS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                {label('Project Type')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PROJECT_TYPES.map(t => (
                    <button key={t} onClick={() => f('projectType', t)} style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${form.projectType === t ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 18%)'}`, background: form.projectType === t ? 'hsl(205 90% 48% / 0.1)' : 'transparent', color: form.projectType === t ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 60%)', fontSize: '12px', cursor: 'pointer', touchAction: 'manipulation' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                {label('Project Description *')}
                <textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="Describe the project, goals, and what you'll be doing for the client…" rows={4} style={{ resize: 'vertical', minHeight: '90px' }} />
              </div>

              <button onClick={() => setShowAdvanced(!showAdvanced)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'hsl(240 5% 50%)', cursor: 'pointer', fontSize: '13px', padding: '4px 0', touchAction: 'manipulation' }}>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAdvanced ? 'Hide' : 'Add'} deliverables, timeline & budget
              </button>

              {showAdvanced && (
                <>
                  <div>{label('Deliverables')}<textarea value={form.deliverables} onChange={e => f('deliverables', e.target.value)} placeholder="e.g. 5-page website, mobile-responsive, CMS integration" rows={2} style={{ resize: 'none' }} /></div>
                  <div className="prop-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>{label('Timeline')}<input value={form.timeline} onChange={e => f('timeline', e.target.value)} placeholder="e.g. 4 weeks" /></div>
                    <div>{label('Budget')}<input value={form.budget} onChange={e => f('budget', e.target.value)} placeholder="e.g. $3,500" /></div>
                  </div>
                </>
              )}

              <div>
                {label('Tone')}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {TONES.map(t => (
                    <button key={t} onClick={() => f('tone', t)} style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${form.tone === t ? 'hsl(262, 83%, 58%)' : 'hsl(240 6% 18%)'}`, background: form.tone === t ? 'hsl(262 83% 58% / 0.1)' : 'transparent', color: form.tone === t ? 'hsl(262, 83%, 75%)' : 'hsl(240 5% 60%)', fontSize: '12px', cursor: 'pointer', touchAction: 'manipulation' }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={generate} disabled={generating || !form.clientName.trim() || !form.description.trim()} className="btn btn-primary" style={{ height: '48px', fontSize: '15px', fontWeight: 600, gap: '8px' }}>
            {generating ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Generating…</> : <><Sparkles size={16} /> Generate Proposal</>}
          </button>
        </div>

        {/* Output */}
        {output && (
          <div className="card" style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid hsl(240 6% 14%)' }}>
              <FileText size={15} color="hsl(205, 90%, 60%)" />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Generated Proposal</span>
              {generating && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', marginLeft: 'auto' }} />}
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'hsl(0 0% 85%)' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(output) + (generating ? '<span class="typing"></span>' : '') }} />
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .proposal-grid { grid-template-columns: 1fr !important; }
          .prop-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
