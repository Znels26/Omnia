'use client';
import { useState, useMemo } from 'react';
import { Sparkles, ArrowRight, Check, TrendingDown, TrendingUp, Globe, Layers } from 'lucide-react';

// Shared tool pricing data (subset of full STACK_MAP)
const TOOLS: Record<string, { feature: string; icon: string; usd: number; plan: 'free' | 'plus' | 'pro' }> = {
  'notion':         { feature: 'Notes + Doc Builder',           icon: '📝', usd: 10,  plan: 'free' },
  'notionai':       { feature: 'Notes + Doc Builder',           icon: '📝', usd: 18,  plan: 'free' },
  'obsidian':       { feature: 'Notes',                         icon: '📝', usd: 10,  plan: 'free' },
  'evernote':       { feature: 'Notes',                         icon: '📝', usd: 10,  plan: 'free' },
  'bear':           { feature: 'Notes',                         icon: '📝', usd: 3,   plan: 'free' },
  'roamresearch':   { feature: 'Notes',                         icon: '📝', usd: 15,  plan: 'free' },
  'craft':          { feature: 'Notes + Doc Builder',           icon: '📝', usd: 5,   plan: 'free' },
  'mem':            { feature: 'Notes',                         icon: '📝', usd: 14,  plan: 'free' },
  'todoist':        { feature: 'Planner',                       icon: '✅', usd: 4,   plan: 'free' },
  'asana':          { feature: 'Planner',                       icon: '✅', usd: 13,  plan: 'free' },
  'trello':         { feature: 'Planner',                       icon: '✅', usd: 5,   plan: 'free' },
  'linear':         { feature: 'Planner',                       icon: '✅', usd: 8,   plan: 'free' },
  'monday':         { feature: 'Planner',                       icon: '✅', usd: 12,  plan: 'free' },
  'clickup':        { feature: 'Planner',                       icon: '✅', usd: 7,   plan: 'free' },
  'anydo':          { feature: 'Planner',                       icon: '✅', usd: 6,   plan: 'free' },
  'any.do':         { feature: 'Planner',                       icon: '✅', usd: 6,   plan: 'free' },
  'ticktick':       { feature: 'Planner + Reminders',           icon: '🔔', usd: 3,   plan: 'free' },
  'habitica':       { feature: 'Planner — Habits',              icon: '✅', usd: 9,   plan: 'free' },
  'streaks':        { feature: 'Planner — Habits',              icon: '✅', usd: 3,   plan: 'free' },
  'habitify':       { feature: 'Planner — Habits',              icon: '✅', usd: 8,   plan: 'free' },
  'chatgpt':        { feature: 'AI Assistant',                  icon: '🤖', usd: 20,  plan: 'free' },
  'claude':         { feature: 'AI Assistant',                  icon: '🤖', usd: 20,  plan: 'free' },
  'gemini':         { feature: 'AI Assistant',                  icon: '🤖', usd: 20,  plan: 'free' },
  'perplexity':     { feature: 'AI Assistant + Web Search',     icon: '🤖', usd: 20,  plan: 'free' },
  'copilot':        { feature: 'AI Assistant',                  icon: '🤖', usd: 20,  plan: 'free' },
  'grok':           { feature: 'AI Assistant',                  icon: '🤖', usd: 16,  plan: 'free' },
  'jasper':         { feature: 'Content Studio',                icon: '✍️', usd: 39,  plan: 'free' },
  'copy.ai':        { feature: 'Content Studio',                icon: '✍️', usd: 36,  plan: 'free' },
  'copyai':         { feature: 'Content Studio',                icon: '✍️', usd: 36,  plan: 'free' },
  'writesonic':     { feature: 'Content Studio',                icon: '✍️', usd: 16,  plan: 'free' },
  'rytr':           { feature: 'Content Studio',                icon: '✍️', usd: 9,   plan: 'free' },
  'buffer':         { feature: 'Content Studio',                icon: '✍️', usd: 15,  plan: 'free' },
  'hootsuite':      { feature: 'Content Studio',                icon: '✍️', usd: 99,  plan: 'free' },
  'later':          { feature: 'Content Studio',                icon: '✍️', usd: 25,  plan: 'free' },
  'dropbox':        { feature: 'Files',                         icon: '📁', usd: 12,  plan: 'free' },
  'googledrive':    { feature: 'Files',                         icon: '📁', usd: 3,   plan: 'free' },
  'onedrive':       { feature: 'Files',                         icon: '📁', usd: 2,   plan: 'free' },
  'freshbooks':     { feature: 'Invoices',                      icon: '💰', usd: 17,  plan: 'plus' },
  'quickbooks':     { feature: 'Invoices',                      icon: '💰', usd: 30,  plan: 'plus' },
  'xero':           { feature: 'Invoices',                      icon: '💰', usd: 15,  plan: 'plus' },
  'bonsai':         { feature: 'Invoices',                      icon: '💰', usd: 25,  plan: 'plus' },
  'honeybook':      { feature: 'Invoices + Proposals',          icon: '💰', usd: 36,  plan: 'plus' },
  'dubsado':        { feature: 'Invoices + Proposals',          icon: '💰', usd: 20,  plan: 'plus' },
  'harvest':        { feature: 'Invoices',                      icon: '💰', usd: 12,  plan: 'plus' },
  'ynab':           { feature: 'Life Hub — Budget Planner',     icon: '💵', usd: 15,  plan: 'plus' },
  'monarchmoney':   { feature: 'Life Hub — Budget Planner',     icon: '💵', usd: 15,  plan: 'plus' },
  'copilotmoney':   { feature: 'Life Hub — Budget Planner',     icon: '💵', usd: 14,  plan: 'plus' },
  'myfitnesspal':   { feature: 'Life Hub — Calorie Tracker',    icon: '🏋️', usd: 20,  plan: 'plus' },
  'cronometer':     { feature: 'Life Hub — Macro Tracker',      icon: '🏋️', usd: 10,  plan: 'plus' },
  'fitbod':         { feature: 'Life Hub — Workout Planner',    icon: '🏋️', usd: 13,  plan: 'plus' },
  'hevy':           { feature: 'Life Hub — Workout Tracker',    icon: '🏋️', usd: 5,   plan: 'plus' },
  'noom':           { feature: 'Life Hub — Meal + Wellness',    icon: '🏋️', usd: 59,  plan: 'plus' },
  'whoop':          { feature: 'Life Hub — Recovery Planner',   icon: '🏋️', usd: 30,  plan: 'plus' },
  'strava':         { feature: 'Life Hub — Progress Tracker',   icon: '🏋️', usd: 12,  plan: 'plus' },
  'mailchimp':      { feature: 'AI Money Tools — Email',        icon: '📧', usd: 13,  plan: 'plus' },
  'convertkit':     { feature: 'AI Money Tools — Email',        icon: '📧', usd: 15,  plan: 'plus' },
  'activecampaign': { feature: 'AI Money Tools — Email',        icon: '📧', usd: 29,  plan: 'plus' },
  'klaviyo':        { feature: 'AI Money Tools — Email',        icon: '📧', usd: 20,  plan: 'plus' },
  'beehiiv':        { feature: 'AI Money Tools — Newsletter',   icon: '📧', usd: 42,  plan: 'plus' },
  'flodesk':        { feature: 'AI Money Tools — Email',        icon: '📧', usd: 38,  plan: 'plus' },
  'semrush':        { feature: 'AI Money Tools — SEO Blog',     icon: '🔍', usd: 130, plan: 'plus' },
  'ahrefs':         { feature: 'AI Money Tools — SEO Blog',     icon: '🔍', usd: 99,  plan: 'plus' },
  'surferseo':      { feature: 'AI Money Tools — SEO Blog',     icon: '🔍', usd: 89,  plan: 'plus' },
  'frase':          { feature: 'AI Money Tools — SEO Blog',     icon: '🔍', usd: 15,  plan: 'plus' },
  'proposify':      { feature: 'Proposals',                     icon: '📋', usd: 49,  plan: 'plus' },
  'pandadoc':       { feature: 'Proposals',                     icon: '📋', usd: 19,  plan: 'plus' },
  'qwilr':          { feature: 'Proposals',                     icon: '📋', usd: 35,  plan: 'plus' },
  'betterproposals':{ feature: 'Proposals',                     icon: '📋', usd: 19,  plan: 'plus' },
  'googledocs':     { feature: 'Doc Builder',                   icon: '📄', usd: 0,   plan: 'free' },
  'word':           { feature: 'Doc Builder',                   icon: '📄', usd: 10,  plan: 'free' },
  'coda':           { feature: 'Notes + Doc Builder',           icon: '📄', usd: 10,  plan: 'free' },
  'cursor':         { feature: 'Code Studio',                   icon: '💻', usd: 20,  plan: 'pro' },
  'v0':             { feature: 'Code Studio',                   icon: '💻', usd: 20,  plan: 'pro' },
  'bolt':           { feature: 'Code Studio',                   icon: '💻', usd: 20,  plan: 'pro' },
  'bolt.new':       { feature: 'Code Studio',                   icon: '💻', usd: 20,  plan: 'pro' },
  'lovable':        { feature: 'Code Studio',                   icon: '💻', usd: 20,  plan: 'pro' },
  'webflow':        { feature: 'Code Studio',                   icon: '💻', usd: 23,  plan: 'pro' },
  'framer':         { feature: 'Code Studio',                   icon: '💻', usd: 20,  plan: 'pro' },
  'replit':         { feature: 'Code Studio',                   icon: '💻', usd: 25,  plan: 'pro' },
  'codesandbox':    { feature: 'Code Studio',                   icon: '💻', usd: 12,  plan: 'pro' },
  'wix':            { feature: 'Code Studio',                   icon: '💻', usd: 16,  plan: 'pro' },
  'squarespace':    { feature: 'Code Studio',                   icon: '💻', usd: 16,  plan: 'pro' },
};

const COUNTRIES = [
  { code: 'US', name: '🇺🇸 USD', symbol: '$',   rate: 1.0  },
  { code: 'GB', name: '🇬🇧 GBP', symbol: '£',   rate: 0.79 },
  { code: 'EU', name: '🇪🇺 EUR', symbol: '€',   rate: 0.92 },
  { code: 'AU', name: '🇦🇺 AUD', symbol: 'A$',  rate: 1.53 },
  { code: 'CA', name: '🇨🇦 CAD', symbol: 'C$',  rate: 1.37 },
  { code: 'IN', name: '🇮🇳 INR', symbol: '₹',   rate: 60   },
  { code: 'SG', name: '🇸🇬 SGD', symbol: 'S$',  rate: 1.34 },
  { code: 'AE', name: '🇦🇪 AED', symbol: 'AED', rate: 3.67 },
  { code: 'BR', name: '🇧🇷 BRL', symbol: 'R$',  rate: 3.5  },
  { code: 'MX', name: '🇲🇽 MXN', symbol: 'MX$', rate: 12.0 },
];

// Prices in AUD (canonical). Convert to local via: aud * country.rate / AU_RATE
const OMNIA = { plus: { name: 'Plus', aud: 25, annualAud: 199 }, pro: { name: 'Pro', aud: 40, annualAud: 329 } };
const AU_RATE = 1.53; // A$ per USD

const EXAMPLE_STACKS = [
  ['ChatGPT', 'Notion', 'Todoist', 'FreshBooks'],
  ['Cursor', 'ChatGPT', 'Bolt', 'Notion'],
  ['YNAB', 'MyFitnessPal', 'Todoist', 'Evernote'],
  ['Jasper', 'Mailchimp', 'Proposify', 'Asana'],
  ['SEMrush', 'Hootsuite', 'Claude', 'Trello'],
];

function norm(s: string) { return s.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9.]/g, ''); }

function fmt(symbol: string, n: number) { return `${symbol}${n}`; }

export function StackWidget() {
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [countryCode, setCountryCode] = useState('US');

  const country = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];

  const tools = useMemo(() => {
    if (!done) return [];
    return input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  }, [input, done]);

  const results = useMemo(() => tools.map(raw => {
    const n = norm(raw);
    const direct = TOOLS[n];
    if (direct) return { raw, data: direct };
    const partial = Object.entries(TOOLS).find(([k]) => n.includes(k) || k.includes(n));
    return { raw, data: partial?.[1] ?? null };
  }), [tools]);

  const matched = results.filter(r => r.data);
  const unmatched = results.filter(r => !r.data);
  const totalUSD = matched.reduce((s, r) => s + (r.data?.usd ?? 0), 0);
  const totalLocal = Math.round(totalUSD * country.rate);
  const needsPro = matched.some(r => r.data?.plan === 'pro');
  const plan = needsPro ? OMNIA.pro : OMNIA.plus;
  const omniaLocal = Math.round(plan.aud * country.rate / AU_RATE);
  const omniaAnnualLocal = Math.round(plan.annualAud * country.rate / AU_RATE);
  const savingsLocal = totalLocal - omniaLocal;

  const analyse = () => {
    const list = input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (!list.length) return;
    setDone(true);
  };

  const tryExample = (stack: string[]) => {
    setInput(stack.join('\n'));
    setDone(true);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <style>{`
        .sw-input-row { display: flex; gap: 10px; align-items: flex-start; }
        .sw-controls  { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
        @media (max-width: 520px) {
          .sw-input-row { flex-direction: column; }
          .sw-controls  { flex-direction: row; align-items: center; justify-content: space-between; }
        }
        .sw-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        @media (max-width: 480px) { .sw-summary { grid-template-columns: 1fr 1fr; } }
        .sw-save-col { background: var(--save-bg); border: 1px solid var(--save-bd); border-radius: 10px; padding: 12px; text-align: center; }
        @media (max-width: 480px) { .sw-save-col { grid-column: span 2; } }
        .sw-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; background: hsl(240 6% 10%); border: 1px solid hsl(240 6% 16%); border-radius: 7px; font-size: 11px; flex-wrap: nowrap; }
        .sw-cta-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .sw-footer-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        @media (max-width: 400px) { .sw-footer-row .sw-footer-note { display: none; } }
      `}</style>

      {!done ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="sw-input-row">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Notion, ChatGPT, Todoist, FreshBooks, Cursor..."
              rows={3}
              style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.6, width: '100%', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '10px', padding: '11px 13px', color: 'hsl(0 0% 85%)', fontSize: '14px', minWidth: 0 }}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) analyse(); }}
            />
            <div className="sw-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Globe size={12} color="hsl(240 5% 48%)" />
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  style={{ background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '7px', color: 'hsl(0 0% 78%)', padding: '6px 8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <button
                onClick={analyse}
                disabled={!input.trim()}
                style={{ padding: '10px 18px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '9px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: input.trim() ? 1 : 0.5, whiteSpace: 'nowrap' }}
              >
                <Sparkles size={13} /> Calculate
              </button>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '10px', color: 'hsl(240 5% 38%)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Try an example</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {EXAMPLE_STACKS.map((stack, i) => (
                <button key={i} onClick={() => tryExample(stack)}
                  style={{ padding: '5px 10px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 15%)', borderRadius: '7px', fontSize: '11px', color: 'hsl(240 5% 58%)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {stack.slice(0, 2).join(' + ')} +{stack.length - 2}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 3-col summary (2-col on mobile, save spans full width) */}
          <div className="sw-summary">
            <div style={{ padding: '12px', background: 'hsl(0 60% 50% / 0.08)', border: '1px solid hsl(0 60% 50% / 0.2)', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: 'hsl(0 60% 58%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>You pay now</p>
              <p style={{ fontSize: 'clamp(20px,5vw,26px)', fontWeight: 800, color: 'hsl(0 60% 65%)', letterSpacing: '-0.02em' }}>{fmt(country.symbol, totalLocal)}<span style={{ fontSize: '11px', fontWeight: 400, color: 'hsl(0 60% 48%)' }}>/mo</span></p>
            </div>
            <div style={{ padding: '12px', background: 'hsl(142 70% 40% / 0.08)', border: '1px solid hsl(142 70% 40% / 0.2)', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: 'hsl(142,70%,52%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>Omnia {plan.name}</p>
              <p style={{ fontSize: 'clamp(20px,5vw,26px)', fontWeight: 800, color: 'hsl(142,70%,60%)', letterSpacing: '-0.02em' }}>{fmt(country.symbol, omniaLocal)}<span style={{ fontSize: '11px', fontWeight: 400, color: 'hsl(142 70% 38%)' }}>/mo</span></p>
              <p style={{ fontSize: '10px', color: 'hsl(142 70% 38%)', marginTop: '3px' }}>or {fmt(country.symbol, omniaAnnualLocal)}/yr</p>
            </div>
            <div className="sw-save-col" style={{ ['--save-bg' as any]: savingsLocal >= 0 ? 'hsl(38 95% 60% / 0.08)' : 'hsl(205 90% 48% / 0.08)', ['--save-bd' as any]: savingsLocal >= 0 ? 'hsl(38 95% 60% / 0.25)' : 'hsl(205 90% 48% / 0.25)' }}>
              <p style={{ fontSize: '10px', color: savingsLocal >= 0 ? 'hsl(38,95%,62%)' : 'hsl(205,90%,62%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
                {savingsLocal >= 0 ? '🎉 You save' : 'Add just'}
              </p>
              <p style={{ fontSize: 'clamp(20px,5vw,26px)', fontWeight: 800, color: savingsLocal >= 0 ? 'hsl(38,95%,65%)' : 'hsl(205,90%,65%)', letterSpacing: '-0.02em' }}>
                {fmt(country.symbol, Math.abs(savingsLocal))}<span style={{ fontSize: '11px', fontWeight: 400 }}>/mo</span>
              </p>
            </div>
          </div>

          {/* Value message */}
          <div style={{ padding: '12px 14px', background: 'hsl(240 8% 8%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            {savingsLocal >= 0
              ? <TrendingDown size={16} color="hsl(142,70%,55%)" style={{ flexShrink: 0, marginTop: '2px' }} />
              : <TrendingUp size={16} color="hsl(205,90%,60%)" style={{ flexShrink: 0, marginTop: '2px' }} />
            }
            <p style={{ fontSize: '12px', color: 'hsl(0 0% 72%)', lineHeight: 1.55 }}>
              {savingsLocal >= 0
                ? <><strong style={{ color: 'hsl(142,70%,60%)' }}>Save {fmt(country.symbol, savingsLocal)}/mo ({fmt(country.symbol, savingsLocal * 12)}/yr)</strong> and get AI Assistant, Autopilot, Reminders, Doc Builder and more bundled in.</>
                : <>For just <strong style={{ color: 'hsl(205,90%,65%)' }}>{fmt(country.symbol, Math.abs(savingsLocal))} more/mo</strong> you get {matched.length} tools replaced <em>plus</em> Autopilot, Notes, Planner, Reminders{needsPro ? ', Code Studio' : ', Life Hub'} and more.</>
              }
            </p>
          </div>

          {/* Matched chips */}
          {matched.length > 0 && (
            <div>
              <p style={{ fontSize: '10px', color: 'hsl(240 5% 42%)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '7px' }}>
                {matched.length} replaced · {unmatched.length > 0 ? `${unmatched.length} not covered yet` : 'all covered!'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {matched.map((r, i) => (
                  <div key={i} className="sw-chip">
                    <span>{r.data!.icon}</span>
                    <span style={{ color: 'hsl(0 0% 68%)' }}>{r.raw}</span>
                    <ArrowRight size={9} color="hsl(240 5% 38%)" />
                    <span style={{ color: 'hsl(205,90%,65%)', fontWeight: 600 }}>{r.data!.feature}</span>
                    {r.data!.usd > 0 && <span style={{ color: 'hsl(0 60% 55%)' }}>−{fmt(country.symbol, Math.round(r.data!.usd * country.rate))}</span>}
                    <Check size={9} color="#34d399" />
                  </div>
                ))}
                {unmatched.map((r, i) => (
                  <div key={i} className="sw-chip" style={{ opacity: 0.5 }}>
                    <span style={{ color: 'hsl(240 5% 48%)' }}>{r.raw}</span>
                    <span style={{ color: 'hsl(240 5% 38%)', fontSize: '10px' }}>not yet</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA row */}
          <div className="sw-cta-row">
            <a href={`/signup?plan=${plan.name.toLowerCase()}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '11px 22px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '9px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 3px 16px hsl(205 90% 48% / 0.3)', whiteSpace: 'nowrap' }}>
              Get Omnia {plan.name} <ArrowRight size={13} />
            </a>
            <a href="/signup" style={{ fontSize: '12px', color: 'hsl(240 5% 52%)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Start free →</a>
            <button onClick={() => { setDone(false); setInput(''); }}
              style={{ marginLeft: 'auto', fontSize: '11px', color: 'hsl(240 5% 42%)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
              Try again
            </button>
          </div>

          {/* Currency footer */}
          <div className="sw-footer-row">
            <Globe size={11} color="hsl(240 5% 38%)" />
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'hsl(240 5% 50%)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <span className="sw-footer-note" style={{ fontSize: '11px', color: 'hsl(240 5% 33%)' }}>· Prices are approximate</span>
          </div>
        </div>
      )}
    </div>
  );
}
