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

const OMNIA = { plus: { name: 'Plus', usd: 24 }, pro: { name: 'Pro', usd: 49 } };

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
  const omniaLocal = Math.round(plan.usd * country.rate);
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
      {!done ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Country + input row */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={'Notion, ChatGPT, Todoist, FreshBooks, Cursor...'}
                rows={3}
                style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.6, width: '100%', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '10px', padding: '12px 14px', color: 'hsl(0 0% 85%)', fontSize: '14px' }}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) analyse(); }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={13} color="hsl(240 5% 50%)" />
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  style={{ background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '8px', color: 'hsl(0 0% 80%)', padding: '7px 10px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <button
                onClick={analyse}
                disabled={!input.trim()}
                style={{ padding: '10px 20px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: input.trim() ? 1 : 0.5 }}
              >
                <Sparkles size={14} /> Calculate
              </button>
            </div>
          </div>

          {/* Example stacks */}
          <div>
            <p style={{ fontSize: '11px', color: 'hsl(240 5% 40%)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Try an example stack</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EXAMPLE_STACKS.map((stack, i) => (
                <button
                  key={i}
                  onClick={() => tryExample(stack)}
                  style={{ padding: '6px 12px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(240 5% 60%)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {stack.slice(0, 3).join(' + ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Results summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '16px', background: 'hsl(0 60% 50% / 0.08)', border: '1px solid hsl(0 60% 50% / 0.2)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'hsl(0 60% 60%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>You pay now</p>
              <p style={{ fontSize: '26px', fontWeight: 800, color: 'hsl(0 60% 65%)' }}>{fmt(country.symbol, totalLocal)}<span style={{ fontSize: '12px', fontWeight: 400, color: 'hsl(0 60% 50%)' }}>/mo</span></p>
            </div>
            <div style={{ padding: '16px', background: 'hsl(142 70% 40% / 0.08)', border: '1px solid hsl(142 70% 40% / 0.2)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'hsl(142, 70%, 55%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Omnia {plan.name}</p>
              <p style={{ fontSize: '26px', fontWeight: 800, color: 'hsl(142, 70%, 60%)' }}>{fmt(country.symbol, omniaLocal)}<span style={{ fontSize: '12px', fontWeight: 400, color: 'hsl(142 70% 40%)' }}>/mo</span></p>
            </div>
            <div style={{ padding: '16px', background: savingsLocal >= 0 ? 'hsl(38 95% 60% / 0.08)' : 'hsl(205 90% 48% / 0.08)', border: `1px solid ${savingsLocal >= 0 ? 'hsl(38 95% 60% / 0.25)' : 'hsl(205 90% 48% / 0.25)'}`, borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: savingsLocal >= 0 ? 'hsl(38, 95%, 65%)' : 'hsl(205, 90%, 65%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                {savingsLocal >= 0 ? 'You save' : 'Just add'}
              </p>
              <p style={{ fontSize: '26px', fontWeight: 800, color: savingsLocal >= 0 ? 'hsl(38, 95%, 65%)' : 'hsl(205, 90%, 65%)' }}>
                {fmt(country.symbol, Math.abs(savingsLocal))}<span style={{ fontSize: '12px', fontWeight: 400 }}>/mo</span>
              </p>
            </div>
          </div>

          {/* Saving or value message */}
          <div style={{ padding: '14px 16px', background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {savingsLocal >= 0
              ? <TrendingDown size={18} color="hsl(142, 70%, 55%)" style={{ flexShrink: 0 }} />
              : <TrendingUp size={18} color="hsl(205, 90%, 60%)" style={{ flexShrink: 0 }} />
            }
            <p style={{ fontSize: '13px', color: 'hsl(0 0% 75%)', lineHeight: 1.5 }}>
              {savingsLocal >= 0
                ? <><strong style={{ color: 'hsl(142, 70%, 60%)' }}>Save {fmt(country.symbol, savingsLocal)}/mo ({fmt(country.symbol, savingsLocal * 12)}/year)</strong> and get AI Assistant, Autopilot, Reminders, and more — all bundled in.</>
                : <>For just <strong style={{ color: 'hsl(205, 90%, 65%)' }}>{fmt(country.symbol, Math.abs(savingsLocal))} more/mo</strong> you get {matched.length} tools replaced <em>plus</em> AI Autopilot, Notes, Planner, Reminders, Doc Builder{needsPro ? ', Code Studio' : ', Life Hub'} and more.</>
              }
            </p>
          </div>

          {/* Matched tools chips */}
          {matched.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '8px' }}>
                {matched.length} tool{matched.length !== 1 ? 's' : ''} replaced
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {matched.map((r, i) => (
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '8px', fontSize: '12px' }}>
                    <span>{r.data!.icon}</span>
                    <span style={{ color: 'hsl(0 0% 70%)' }}>{r.raw}</span>
                    <ArrowRight size={10} color="hsl(240 5% 40%)" />
                    <span style={{ color: 'hsl(205, 90%, 65%)', fontWeight: 600 }}>{r.data!.feature}</span>
                    {r.data!.usd > 0 && <span style={{ color: 'hsl(0 60% 55%)', fontSize: '10px' }}>−{fmt(country.symbol, Math.round(r.data!.usd * country.rate))}/mo</span>}
                    <Check size={10} color="#34d399" />
                  </div>
                ))}
                {unmatched.map((r, i) => (
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 13%)', borderRadius: '8px', fontSize: '12px', opacity: 0.6 }}>
                    <span style={{ color: 'hsl(240 5% 50%)' }}>{r.raw}</span>
                    <span style={{ fontSize: '10px', color: 'hsl(240 5% 40%)' }}>not covered yet</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={`/signup?plan=${plan.name.toLowerCase()}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px hsl(205 90% 48% / 0.3)' }}
            >
              Get Omnia {plan.name} <ArrowRight size={15} />
            </a>
            <a href="/signup" style={{ fontSize: '13px', color: 'hsl(240 5% 55%)', textDecoration: 'none' }}>
              Or start free →
            </a>
            <button
              onClick={() => { setDone(false); setInput(''); }}
              style={{ marginLeft: 'auto', fontSize: '12px', color: 'hsl(240 5% 45%)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Try another stack
            </button>
          </div>

          {/* Country selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={12} color="hsl(240 5% 40%)" />
            <span style={{ fontSize: '11px', color: 'hsl(240 5% 40%)' }}>Showing prices in</span>
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'hsl(240 5% 55%)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
            >
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <span style={{ fontSize: '11px', color: 'hsl(240 5% 35%)' }}>· Prices are approximate</span>
          </div>
        </div>
      )}
    </div>
  );
}
