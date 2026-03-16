"use client";

import { useState, useRef } from 'react';

type Tool = 'lead-magnet' | 'seo-blog' | 'email-sequence' | 'passive-income';

const TOOLS = [
  {
    id: 'lead-magnet' as Tool,
    label: 'Lead Magnet Builder',
    emoji: '🧲',
    desc: 'Create irresistible free offers that grow your email list',
    fields: [
      { key: 'niche', label: 'Your niche / industry', placeholder: 'e.g. personal finance for millennials', required: true },
      { key: 'audience', label: 'Target audience', placeholder: 'e.g. 25-35 year olds with debt', required: true },
      { key: 'problem', label: 'Problem it solves', placeholder: 'e.g. they overspend on subscriptions' },
      { key: 'format', label: 'Format preference', placeholder: 'e.g. checklist, mini guide, template' },
    ],
  },
  {
    id: 'seo-blog' as Tool,
    label: 'SEO Blog Writer',
    emoji: '✍️',
    desc: 'Full SEO-optimised blog posts ready to publish and rank',
    fields: [
      { key: 'keyword', label: 'Target keyword', placeholder: 'e.g. best budgeting apps 2025', required: true },
      { key: 'audience', label: 'Target audience', placeholder: 'e.g. first-time homebuyers' },
      { key: 'tone', label: 'Tone', placeholder: 'e.g. casual, expert, conversational' },
      { key: 'wordCount', label: 'Word count', placeholder: 'e.g. 1200' },
    ],
  },
  {
    id: 'email-sequence' as Tool,
    label: 'Email Sequence',
    emoji: '📧',
    desc: 'Full email nurture sequences that convert subscribers to buyers',
    fields: [
      { key: 'product', label: 'Product / service', placeholder: 'e.g. online course on freelancing', required: true },
      { key: 'audience', label: 'Target audience', placeholder: 'e.g. aspiring freelancers', required: true },
      { key: 'goal', label: 'Sequence goal', placeholder: 'e.g. convert free trial to paid' },
      { key: 'emailCount', label: 'Number of emails', placeholder: 'e.g. 5 (max 7)' },
      { key: 'tone', label: 'Tone', placeholder: 'e.g. friendly mentor' },
    ],
  },
  {
    id: 'passive-income' as Tool,
    label: 'Passive Income',
    emoji: '💰',
    desc: 'Personalised passive income strategies based on your skills',
    fields: [
      { key: 'skills', label: 'Your skills & expertise', placeholder: 'e.g. graphic design, copywriting, coding', required: true },
      { key: 'timePerWeek', label: 'Hours per week available', placeholder: 'e.g. 5-10 hours' },
      { key: 'startingCapital', label: 'Starting capital', placeholder: 'e.g. $500 or none' },
      { key: 'goals', label: 'Income goals', placeholder: 'e.g. $2k/month within a year' },
    ],
  },
];

const ENDPOINTS: Record<Tool, string> = {
  'lead-magnet': '/api/ai/lead-magnet',
  'seo-blog': '/api/ai/seo-blog',
  'email-sequence': '/api/ai/email-sequence',
  'passive-income': '/api/ai/passive-income',
};

export function AiToolsView({ profile }: { profile: any }) {
  const [activeTool, setActiveTool] = useState<Tool>('lead-magnet');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const tool = TOOLS.find((t) => t.id === activeTool)!;

  const handleToolChange = (id: Tool) => {
    setActiveTool(id);
    setFields({});
    setOutput('');
    setError('');
    setShowOutput(false);
  };

  const handleGenerate = async () => {
    setOutput('');
    setError('');
    setLoading(true);
    setShowOutput(true);

    try {
      const res = await fetch(ENDPOINTS[activeTool], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Something went wrong');
        return;
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]' || !data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              accumulated += parsed.token;
              setOutput(accumulated);
              outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .ait-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .ait-tab { padding: 10px 8px; border-radius: 10px; border: 1px solid hsl(240 6% 14%); background: hsl(240 6% 9%); color: hsl(240 5% 55%); font-size: 13px; font-weight: 500; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; transition: all 0.15s; }
        .ait-tab.active { border-color: hsl(205,90%,48%); background: hsl(205 90% 48% / 0.12); color: hsl(205,90%,60%); font-weight: 600; }
        .ait-tab-emoji { font-size: 18px; line-height: 1; }
        .ait-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
        .ait-output-panel { background: hsl(240 6% 9%); border: 1px solid hsl(240 6% 14%); border-radius: 12px; min-height: 480px; display: flex; flex-direction: column; }
        .ait-mobile-back { display: none; }
        @media (max-width: 700px) {
          .ait-tabs { grid-template-columns: repeat(2, 1fr); }
          .ait-layout { grid-template-columns: 1fr; }
          .ait-output-panel { min-height: 400px; }
          .ait-form-panel { display: block; }
          .ait-mobile-back { display: flex; }
        }
      `}</style>
      <div className="page" style={{ paddingBottom: '80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>AI Money Tools</h1>
          <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', margin: 0 }}>
            Generate assets that make you money — leads, content, emails, and more.
          </p>
        </div>

        {/* Tool picker */}
        <div className="ait-tabs" style={{ marginBottom: '20px' }}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleToolChange(t.id)}
              className={`ait-tab${activeTool === t.id ? ' active' : ''}`}
            >
              <span className="ait-tab-emoji">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="ait-layout">
          {/* Form panel */}
          <div className="ait-form-panel" style={{ background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', margin: '0 0 16px' }}>{tool.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {tool.fields.map((f) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'hsl(240 5% 65%)', marginBottom: '6px' }}>
                    {f.label}{f.required && <span style={{ color: 'hsl(205,90%,60%)' }}> *</span>}
                  </label>
                  <input
                    value={fields[f.key] || ''}
                    onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: '100%', background: 'hsl(240 10% 5%)', border: '1px solid hsl(240 6% 18%)',
                      borderRadius: '8px', padding: '9px 12px', color: '#e2e8f0', fontSize: '13px',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                marginTop: '18px', width: '100%', padding: '12px',
                background: loading ? 'hsl(240 6% 14%)' : 'hsl(205,90%,48%)',
                color: loading ? 'hsl(240 5% 50%)' : '#fff',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Generating...' : `Generate ${tool.emoji}`}
            </button>
          </div>

          {/* Output panel */}
          <div className="ait-output-panel">
            {error && (
              <div style={{ padding: '16px 20px', color: '#f87171', fontSize: '13px', borderBottom: '1px solid hsl(240 6% 14%)' }}>
                {error}
              </div>
            )}
            {!output && !loading && !error && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'hsl(240 5% 38%)', padding: '40px', textAlign: 'center' }}>
                <span style={{ fontSize: '32px' }}>{tool.emoji}</span>
                <p style={{ fontSize: '14px', margin: 0 }}>Fill in the fields and hit Generate</p>
                <p style={{ fontSize: '12px', margin: 0, color: 'hsl(240 5% 32%)' }}>Your output will appear here</p>
              </div>
            )}
            {(output || loading) && (
              <>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'hsl(240 5% 45%)', fontWeight: 600 }}>
                    {loading ? 'Generating...' : 'Output'}
                  </span>
                  {output && (
                    <button
                      onClick={() => navigator.clipboard.writeText(output)}
                      style={{ padding: '4px 12px', background: 'hsl(240 6% 14%)', border: '1px solid hsl(240 6% 20%)', borderRadius: '6px', color: 'hsl(240 5% 70%)', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  )}
                </div>
                <div
                  ref={outputRef}
                  style={{ flex: 1, overflowY: 'auto', padding: '20px', fontSize: '13.5px', lineHeight: '1.8', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                >
                  {output}
                  {loading && <span style={{ color: 'hsl(205,90%,60%)' }}>▋</span>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
