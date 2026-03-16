'use client';
import { useState, useMemo } from 'react';
import { Layers, Share2, Check, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// Map of popular tools → Omnia equivalent
const STACK_MAP: Record<string, { feature: string; description: string; icon: string }> = {
  // Notes & docs
  'notion': { feature: 'Notes + Doc Builder', description: 'Rich notes, folders, AI writing', icon: '📝' },
  'obsidian': { feature: 'Notes', description: 'Organised notes with folders', icon: '📝' },
  'evernote': { feature: 'Notes', description: 'Smart notes with search', icon: '📝' },
  'bear': { feature: 'Notes', description: 'Markdown notes', icon: '📝' },
  'onenote': { feature: 'Notes', description: 'Organised note-taking', icon: '📝' },
  'roamresearch': { feature: 'Notes', description: 'Linked notes', icon: '📝' },
  'logseq': { feature: 'Notes', description: 'Knowledge base notes', icon: '📝' },
  // Tasks & project management
  'todoist': { feature: 'Planner', description: 'Tasks, goals, and habits', icon: '✅' },
  'asana': { feature: 'Planner', description: 'Task and project management', icon: '✅' },
  'trello': { feature: 'Planner', description: 'Task boards and planning', icon: '✅' },
  'linear': { feature: 'Planner', description: 'Issue and task tracking', icon: '✅' },
  'monday': { feature: 'Planner', description: 'Work and project planning', icon: '✅' },
  'clickup': { feature: 'Planner', description: 'Tasks and project management', icon: '✅' },
  'things': { feature: 'Planner', description: 'Task management', icon: '✅' },
  'any.do': { feature: 'Planner', description: 'To-do lists and planning', icon: '✅' },
  // AI assistants
  'chatgpt': { feature: 'AI Assistant', description: 'Conversational AI with memory', icon: '🤖' },
  'claude': { feature: 'AI Assistant', description: 'Powered by Claude under the hood', icon: '🤖' },
  'gemini': { feature: 'AI Assistant', description: 'AI assistant + image gen', icon: '🤖' },
  'perplexity': { feature: 'AI Assistant + Web Search', description: 'AI with live web search', icon: '🤖' },
  'copilot': { feature: 'AI Assistant', description: 'AI writing and productivity', icon: '🤖' },
  'jasper': { feature: 'Content Studio', description: 'AI content creation', icon: '✍️' },
  'copy.ai': { feature: 'Content Studio', description: 'AI copywriting', icon: '✍️' },
  'writesonic': { feature: 'Content Studio', description: 'AI content generation', icon: '✍️' },
  // Content
  'buffer': { feature: 'Content Studio', description: 'Social media content planning', icon: '✍️' },
  'hootsuite': { feature: 'Content Studio', description: 'Social content management', icon: '✍️' },
  'later': { feature: 'Content Studio', description: 'Content scheduling', icon: '✍️' },
  // Files
  'dropbox': { feature: 'Files', description: 'File storage and management', icon: '📁' },
  'googledrive': { feature: 'Files', description: 'Cloud file storage', icon: '📁' },
  'onedrive': { feature: 'Files', description: 'File storage', icon: '📁' },
  'box': { feature: 'Files', description: 'Cloud file management', icon: '📁' },
  // Invoices & finance
  'freshbooks': { feature: 'Invoices', description: 'Invoice creation and tracking', icon: '💰' },
  'wave': { feature: 'Invoices', description: 'Free invoicing', icon: '💰' },
  'paymo': { feature: 'Invoices', description: 'Invoicing and time tracking', icon: '💰' },
  'bonsai': { feature: 'Invoices', description: 'Freelance invoicing', icon: '💰' },
  'honeybook': { feature: 'Invoices', description: 'Client proposals and invoices', icon: '💰' },
  'quickbooks': { feature: 'Invoices', description: 'Professional invoicing', icon: '💰' },
  'xero': { feature: 'Invoices', description: 'Business invoicing', icon: '💰' },
  'invoiceninja': { feature: 'Invoices', description: 'Invoice management', icon: '💰' },
  // Reminders
  'fantastical': { feature: 'Reminders', description: 'Smart reminders and scheduling', icon: '🔔' },
  'googlecalendar': { feature: 'Reminders', description: 'Event and reminder management', icon: '🔔' },
  'calendly': { feature: 'Reminders', description: 'Schedule and reminder management', icon: '🔔' },
  'tick tick': { feature: 'Reminders + Planner', description: 'Tasks and reminders', icon: '🔔' },
  'ticktick': { feature: 'Reminders + Planner', description: 'Tasks and reminders', icon: '🔔' },
  // Documents
  'googledocs': { feature: 'Doc Builder', description: 'AI-powered document creation', icon: '📄' },
  'word': { feature: 'Doc Builder', description: 'Professional document writing', icon: '📄' },
  'pages': { feature: 'Doc Builder', description: 'Document creation', icon: '📄' },
  // Proposals
  'proposify': { feature: 'Proposal Generator', description: 'AI-written client proposals', icon: '📋' },
  'pandadoc': { feature: 'Proposal Generator', description: 'Smart proposal generation', icon: '📋' },
  'qwilr': { feature: 'Proposal Generator', description: 'Professional proposals', icon: '📋' },
};

function normalise(tool: string) {
  return tool.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9.]/g, '');
}

function matchTool(raw: string): { original: string; match: { feature: string; description: string; icon: string } | null } {
  const n = normalise(raw);
  // Direct match
  if (STACK_MAP[n]) return { original: raw, match: STACK_MAP[n] };
  // Partial match
  for (const key of Object.keys(STACK_MAP)) {
    if (n.includes(key) || key.includes(n)) return { original: raw, match: STACK_MAP[key] };
  }
  return { original: raw, match: null };
}

export function MyStackView() {
  const [input, setInput] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [analysed, setAnalysed] = useState(false);
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => tools.map(matchTool), [tools]);
  const matched = results.filter(r => r.match);
  const unmatched = results.filter(r => !r.match);
  const savings = matched.length;

  const analyse = () => {
    const list = input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (!list.length) { toast.error('Enter at least one tool'); return; }
    setTools(list);
    setAnalysed(true);
  };

  const reset = () => { setAnalysed(false); setTools([]); setInput(''); };

  const shareText = `I replaced ${savings} tool${savings !== 1 ? 's' : ''} with Omnia:\n${matched.map(r => `• ${r.original} → ${r.match!.feature}`).join('\n')}\n\nGet Omnia: omnia.app`;

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'My Omnia Stack', text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="page" style={{ maxWidth: '680px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'hsl(205 90% 48% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={18} color="hsl(205, 90%, 60%)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Replace My Stack</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', lineHeight: 1.5 }}>See which tools you can replace with Omnia — and share the result.</p>
      </div>

      {!analysed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'hsl(0 0% 80%)' }}>
              Enter the tools you currently use
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Notion\nTodoist\nChatGPT\nFreshBooks\nDropbox\nProposify`}
              rows={8}
              style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
            <p style={{ fontSize: '12px', color: 'hsl(240 5% 45%)', marginTop: '8px' }}>One per line, or comma-separated. 50+ tools supported.</p>
          </div>

          <button onClick={analyse} disabled={!input.trim()} className="btn btn-primary" style={{ height: '48px', fontSize: '15px', fontWeight: 600, gap: '8px' }}>
            <Sparkles size={16} /> Analyse My Stack
          </button>

          {/* Sample logos */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', paddingTop: '8px' }}>
            {['Notion', 'Todoist', 'ChatGPT', 'Freshbooks', 'Dropbox', 'Asana', 'Buffer', 'Proposify', 'Calendly', 'Google Docs'].map(t => (
              <span key={t} style={{ padding: '4px 10px', borderRadius: '999px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 16%)', fontSize: '12px', color: 'hsl(240 5% 55%)' }}>{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Hero stat */}
          <div className="card" style={{ padding: '24px', textAlign: 'center', background: 'hsl(205 90% 48% / 0.06)', borderColor: 'hsl(205 90% 48% / 0.2)' }}>
            <div style={{ fontSize: '48px', fontWeight: 800, background: 'linear-gradient(135deg, hsl(205,90%,60%) 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{savings}</div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>tool{savings !== 1 ? 's' : ''} replaced by Omnia</p>
            {unmatched.length > 0 && <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', marginTop: '4px' }}>{unmatched.length} not covered (yet!)</p>}
          </div>

          {/* Matched tools */}
          {matched.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <h2 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px', color: 'hsl(240 5% 60%)' }}>REPLACED BY OMNIA</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {matched.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 14%)' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{r.match!.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(0 0% 75%)', minWidth: '80px', flex: 1 }}>{r.original}</span>
                    <ArrowRight size={14} color="hsl(240 5% 40%)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 2 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(205, 90%, 65%)' }}>{r.match!.feature}</p>
                      <p style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', marginTop: '1px' }}>{r.match!.description}</p>
                    </div>
                    <Check size={14} color="#34d399" style={{ flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmatched */}
          {unmatched.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <h2 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px', color: 'hsl(240 5% 55%)' }}>NOT COVERED (YET)</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {unmatched.map((r, i) => (
                  <span key={i} style={{ padding: '5px 12px', borderRadius: '999px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 16%)', fontSize: '13px', color: 'hsl(240 5% 55%)' }}>{r.original}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={share} className="btn btn-primary" style={{ flex: 1, gap: '8px', minWidth: '120px', height: '44px' }}>
              {copied ? <><Check size={15} /> Copied!</> : <><Share2 size={15} /> Share Result</>}
            </button>
            <button onClick={reset} className="btn btn-outline" style={{ flex: 1, minWidth: '120px', height: '44px' }}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
