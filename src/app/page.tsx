import Link from 'next/link';
import {
  Sparkles, ArrowRight, Zap, Check, Brain, TrendingUp, MessageSquare,
  CalendarDays, FileText, Wand2, FileOutput, Receipt, Bell, DollarSign,
  Heart, FileSignature, Code2, Layers,
} from 'lucide-react';
import { StackWidget } from '@/components/landing/StackWidget';

const FEATURES = [
  { icon: Zap,           label: 'Autopilot',       desc: 'AI Chief of Staff — chases invoices, finds gigs, drafts emails while you sleep', color: '#38aaf5', bg: 'rgba(56,170,245,0.1)'   },
  { icon: Brain,         label: 'Memory Import',   desc: 'Upload ChatGPT/Claude history — Omnia instantly knows everything about you',      color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  { icon: MessageSquare, label: 'AI Assistant',    desc: '6 specialist modes: writing, planning, study, documents, web search',             color: '#38aaf5', bg: 'rgba(56,170,245,0.1)'   },
  { icon: Heart,         label: 'Life Hub',        desc: '22 tools for finance & fitness — budget, invest, train, eat',                    color: '#f472b6', bg: 'rgba(244,114,182,0.1)'  },
  { icon: DollarSign,    label: 'AI Money Tools',  desc: 'Lead magnets, SEO blogs, email sequences & passive income plans',               color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  { icon: CalendarDays,  label: 'Planner',         desc: 'Tasks, goals & habits with AI prioritisation',                                  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  { icon: FileText,      label: 'Notes',           desc: 'AI-powered summaries, smart search, folder organisation',                       color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { icon: Wand2,         label: 'Content Studio',  desc: 'Social posts, captions, blogs, scripts — done in seconds',                     color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  { icon: FileOutput,    label: 'Doc Builder',     desc: 'Export to PDF, Word, Excel and PowerPoint in one click',                       color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  { icon: Receipt,       label: 'Invoices',        desc: 'Professional PDF invoices — create, send and chase payment',                   color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  { icon: FileSignature, label: 'Proposals',       desc: 'AI-written client proposals that win more business',                           color: '#e879f9', bg: 'rgba(232,121,249,0.1)' },
  { icon: Bell,          label: 'Reminders',       desc: 'Smart reminders with recurrence — never miss a deadline',                     color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { icon: Code2,         label: 'Code Studio',     desc: 'Full IDE: Monaco, live preview, AI codegen, Vercel deploy',                   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', pro: true },
  { icon: Sparkles,      label: 'AI Memory',       desc: 'Omnia learns about you so every response feels personal',                     color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
  { icon: TrendingUp,    label: 'AI Everywhere',   desc: 'Summaries, suggestions and AI inside every feature',                          color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
];

const PRICING_PLANS = [
  {
    name: 'Free', price: '$0', period: '', color: 'hsl(240 5% 55%)',
    features: ['Autopilot setup & persona', 'Memory Import (100 conversations)', '30 AI messages/month', 'Notes · Planner · Reminders · Files'],
    cta: 'Start Free', href: '/signup', primary: false,
  },
  {
    name: 'Plus', price: '$24', period: '/mo', color: 'hsl(205,90%,60%)', highlight: true,
    features: ['Autopilot Level 1 (Draft + Send)', 'Morning briefing + opportunities', '500 AI messages/month', 'Life Hub — all 22 tools', 'AI Money Tools + Invoices + Proposals'],
    cta: 'Get Plus', href: '/signup?plan=plus', primary: true,
  },
  {
    name: 'Pro', price: '$49', period: '/mo', color: 'hsl(262,83%,75%)',
    features: ['Full Autopilot — fully autonomous', 'Code Studio (AI IDE + Vercel)', 'Unlimited AI messages', 'Unlimited Memory Import', 'Everything in Plus'],
    cta: 'Get Pro', href: '/signup?plan=pro', primary: false,
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'hsl(240 10% 4%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: 'hsl(0 0% 90%)' }}>

      {/* ── Global styles ── */}
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        /* Nav */
        .nav-links { display: flex; align-items: center; gap: 16px; }
        @media (max-width: 480px) {
          .nav-link-hide { display: none !important; }
          .nav-cta { padding: 7px 13px !important; font-size: 13px !important; }
        }
        /* Stats row */
        .stats-row { display: flex; gap: 0; border: 1px solid hsl(240 6% 14%); border-radius: 14px; overflow: hidden; }
        .stat-item { flex: 1; padding: 14px 16px; text-align: center; border-right: 1px solid hsl(240 6% 14%); }
        .stat-item:last-child { border-right: none; }
        @media (max-width: 500px) {
          .stats-row { display: grid; grid-template-columns: 1fr 1fr; }
          .stat-item:nth-child(2) { border-right: none; }
          .stat-item:nth-child(3) { border-top: 1px solid hsl(240 6% 14%); border-right: 1px solid hsl(240 6% 14%); }
          .stat-item:nth-child(4) { border-top: 1px solid hsl(240 6% 14%); }
        }
        /* Comparison */
        .compare-outer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .compare-outer { grid-template-columns: 1fr; } }
        .compare-inner { background: hsl(240 8% 7%); border: 1px solid hsl(240 6% 14%); border-radius: 14px; overflow: hidden; }
        .compare-head { display: grid; grid-template-columns: 1fr 80px 90px; padding: 11px 14px; background: hsl(240 6% 10%); border-bottom: 1px solid hsl(240 6% 14%); }
        .compare-row  { display: grid; grid-template-columns: 1fr 80px 90px; padding: 10px 14px; align-items: center; }
        @media (max-width: 380px) {
          .compare-head { grid-template-columns: 1fr 60px 72px; padding: 10px 10px; }
          .compare-row  { grid-template-columns: 1fr 60px 72px; padding: 10px 10px; }
        }
        /* Autopilot mockup */
        .ap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
        @media (max-width: 640px) { .ap-grid { grid-template-columns: 1fr; gap: 20px; } .ap-right-first { order: -1; } }
        /* Features grid */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
        @media (max-width: 480px) { .features-grid { grid-template-columns: 1fr 1fr; } }
        /* Pricing */
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 700px) { .pricing-grid { grid-template-columns: 1fr; max-width: 380px; margin: 0 auto; } }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ borderBottom: '1px solid hsl(240 6% 14%)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'hsl(240 10% 4% / 0.96)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} color="hsl(205, 90%, 48%)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px' }}>Omnia</span>
        </div>
        <div className="nav-links">
          <Link href="/pricing" className="nav-link-hide" style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', textDecoration: 'none' }}>Pricing</Link>
          <Link href="/login" className="nav-link-hide" style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" className="nav-cta" style={{ padding: '8px 16px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '9px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 20px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 14px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.25)', marginBottom: '20px' }}>
          <Zap size={12} color="hsl(205, 90%, 60%)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(205, 90%, 60%)' }}>New: Omnia Autopilot — Your AI works while you sleep</span>
        </div>

        <h1 style={{ fontSize: 'clamp(34px, 8vw, 64px)', fontWeight: 400, lineHeight: 1.08, marginBottom: '18px', letterSpacing: '-0.03em' }}>
          Stop juggling apps.<br />
          <span style={{ fontWeight: 800, background: 'linear-gradient(135deg, hsl(205,90%,60%), hsl(262,83%,75%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            One app does it all.
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(15px,3vw,18px)', color: 'hsl(240 5% 55%)', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.65 }}>
          Omnia replaces Notion, ChatGPT, Todoist, FreshBooks and 150+ more tools — then runs on autopilot overnight.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 22px hsl(205 90% 48% / 0.35)' }}>
            Start Free <ArrowRight size={16} />
          </Link>
          <Link href="#replace-stack" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '13px 22px', border: '1px solid hsl(240 6% 18%)', color: 'hsl(0 0% 85%)', borderRadius: '12px', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            <Layers size={14} /> See what you'd save
          </Link>
        </div>

        {/* Stats row */}
        <div className="stats-row" style={{ background: 'hsl(240 8% 7%)' }}>
          {[
            { value: '15', label: 'features' },
            { value: '150+', label: 'tools replaced' },
            { value: '$24', label: 'from /mo' },
            { value: '24/7', label: 'Autopilot' },
          ].map(s => (
            <div key={s.label} className="stat-item">
              <p style={{ fontSize: 'clamp(18px,4vw,22px)', fontWeight: 800, color: 'hsl(205,90%,65%)', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: 'hsl(240 5% 48%)', marginTop: '2px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Autopilot mockup + bullets ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 52px' }}>
        <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '20px', padding: 'clamp(20px,4vw,40px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, hsl(205 90% 48% / 0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div className="ap-grid">
            {/* Left: bullets */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 11px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.12)', border: '1px solid hsl(205 90% 48% / 0.25)', marginBottom: '14px' }}>
                <Zap size={11} color="hsl(205, 90%, 60%)" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(205, 90%, 60%)' }}>Autopilot</span>
              </div>
              <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>Your AI Chief of Staff</h2>
              <p style={{ fontSize: '13px', color: 'hsl(240 5% 55%)', lineHeight: 1.6, marginBottom: '16px' }}>Works overnight — you wake up to a done list.</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {[
                  'Chases unpaid invoices automatically',
                  'Finds freelance gigs matching your skills',
                  'Drafts follow-up emails and proposals',
                  'Generates content ideas every morning',
                  'Monitors your goals in real time',
                  'Briefs you at 7am every day',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'hsl(142 70% 40% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={8} color="hsl(142, 70%, 55%)" />
                    </div>
                    <span style={{ color: 'hsl(0 0% 78%)', lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '9px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                Enable Autopilot <ArrowRight size={13} />
              </Link>
            </div>

            {/* Right: mockup */}
            <div className="ap-right-first" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ background: 'hsl(240 10% 4%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                  <Zap size={12} color="hsl(205, 90%, 60%)" />
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>Today's Actions</span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'hsl(142 70% 40% / 0.15)', color: 'hsl(142, 70%, 55%)', fontWeight: 600 }}>3 ready</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Invoice Chase',     desc: 'Chase #INV-042 — overdue 7 days', color: 'hsl(142,70%,55%)', bg: 'hsl(142 70% 40%/0.06)', bd: 'hsl(142 70% 40%/0.2)' },
                    { label: 'Content Ideas',     desc: '3 ideas ready for your LinkedIn',  color: 'hsl(262,83%,75%)', bg: 'hsl(262 83% 58%/0.06)', bd: 'hsl(262 83% 58%/0.2)' },
                    { label: 'Opportunity Found', desc: 'React Developer gig — $85/hr',     color: 'hsl(38,95%,65%)',  bg: 'hsl(38 95% 60%/0.06)',  bd: 'hsl(38 95% 60%/0.2)'  },
                  ].map(a => (
                    <div key={a.label} style={{ padding: '10px 12px', background: a.bg, border: `1px solid ${a.bd}`, borderRadius: '9px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: a.color }}>{a.label}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'hsl(0 0% 72%)', marginBottom: '7px', lineHeight: 1.4 }}>{a.desc}</p>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button style={{ padding: '3px 8px', borderRadius: '5px', background: `${a.color}25`, border: `1px solid ${a.color}45`, color: a.color, fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                        <button style={{ padding: '3px 8px', borderRadius: '5px', background: 'transparent', border: '1px solid hsl(240 6% 20%)', color: 'hsl(240 5% 50%)', fontSize: '10px', cursor: 'pointer' }}>Dismiss</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Omnia (two comparison tables, stacking on mobile) ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 52px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Why Omnia beats everything else</h2>
          <p style={{ fontSize: '13px', color: 'hsl(240 5% 52%)' }}>ChatGPT waits for you. Omnia works for you.</p>
        </div>
        <div className="compare-outer">
          {/* vs ChatGPT */}
          <div className="compare-inner">
            <div className="compare-head">
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>ChatGPT</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(205,90%,60%)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Omnia</span>
            </div>
            {[
              ['Works without asking', '✗', '✓'],
              ['Remembers you',        '✗', '✓'],
              ['Proactive actions',    '✗', '✓'],
              ['Personalised to you',  '✗', '✓'],
              ['Works while you sleep','✗', '✓'],
            ].map(([feat, bad, good], i) => (
              <div key={i} className="compare-row" style={{ borderTop: '1px solid hsl(240 6% 11%)' }}>
                <span style={{ fontSize: '12px', color: 'hsl(0 0% 74%)' }}>{feat}</span>
                <span style={{ fontSize: '14px', color: 'hsl(0 60% 55%)', textAlign: 'center', fontWeight: 700 }}>{bad}</span>
                <span style={{ fontSize: '14px', color: 'hsl(142,70%,55%)', textAlign: 'center', fontWeight: 700 }}>{good}</span>
              </div>
            ))}
          </div>

          {/* vs 10 separate apps */}
          <div className="compare-inner">
            <div className="compare-head">
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 40%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>10 apps</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(205,90%,60%)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Omnia</span>
            </div>
            {[
              ['Monthly cost',      '$50–$300+', '$24–$49'],
              ['Setup required',    'Yes, each', 'No'],
              ['Context switching', 'Constant',  'Zero'],
              ['AI across all',     'Maybe',     'Always'],
              ['Works together',    'Never',     'Always'],
            ].map(([feat, bad, good], i) => (
              <div key={i} className="compare-row" style={{ borderTop: '1px solid hsl(240 6% 11%)' }}>
                <span style={{ fontSize: '12px', color: 'hsl(0 0% 74%)' }}>{feat}</span>
                <span style={{ fontSize: '11px', color: 'hsl(0 60% 60%)', textAlign: 'center', fontWeight: 600 }}>{bad}</span>
                <span style={{ fontSize: '11px', color: 'hsl(142,70%,55%)', textAlign: 'center', fontWeight: 600 }}>{good}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Replace My Stack ── */}
      <section id="replace-stack" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 52px' }}>
        <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '20px', padding: 'clamp(24px,4vw,40px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '500px', height: '250px', background: 'radial-gradient(ellipse, hsl(142 70% 40% / 0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 13px', borderRadius: '999px', background: 'hsl(142 70% 40% / 0.1)', border: '1px solid hsl(142 70% 40% / 0.25)', marginBottom: '14px' }}>
                <Layers size={11} color="hsl(142, 70%, 55%)" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(142, 70%, 55%)' }}>Replace My Stack</span>
              </div>
              <h2 style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>See exactly how much you'd save</h2>
              <p style={{ fontSize: '13px', color: 'hsl(240 5% 52%)', maxWidth: '420px', margin: '0 auto' }}>
                Type the apps you currently pay for — we'll show which ones Omnia replaces and your savings in your currency.
              </p>
            </div>
            <StackWidget />
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 52px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Everything in one place</h2>
          <p style={{ fontSize: '13px', color: 'hsl(240 5% 52%)' }}>15 features. One subscription. Zero juggling.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f: any) => (
            <div key={f.label} style={{ padding: '16px', background: 'hsl(240 6% 7%)', border: `1px solid ${f.pro ? 'hsl(262 83% 58% / 0.2)' : 'hsl(240 6% 13%)'}`, borderRadius: '12px', position: 'relative' }}>
              {f.pro && (
                <span style={{ position: 'absolute', top: '9px', right: '9px', fontSize: '8px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px', background: 'hsl(262 83% 58% / 0.15)', color: 'hsl(262,83%,75%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro</span>
              )}
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <f.icon size={17} color={f.color} />
              </div>
              <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>{f.label}</p>
              <p style={{ fontSize: '11.5px', color: 'hsl(240 5% 48%)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>Simple, honest pricing</h2>
          <p style={{ fontSize: '13px', color: 'hsl(240 5% 52%)' }}>Start free. Unlock Autopilot and full features from Plus.</p>
        </div>
        <div className="pricing-grid">
          {PRICING_PLANS.map(plan => (
            <div key={plan.name} style={{ padding: '22px 18px', background: 'hsl(240 8% 7%)', border: `1px solid ${plan.highlight ? 'hsl(205 90% 48% / 0.4)' : 'hsl(240 6% 14%)'}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: plan.highlight ? '0 0 36px hsl(205 90% 48% / 0.08)' : 'none' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', padding: '3px 11px', borderRadius: '999px', background: 'hsl(205, 90%, 48%)', color: 'white', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: plan.color, marginBottom: '5px' }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>{plan.price}</span>
                <span style={{ fontSize: '12px', color: 'hsl(240 5% 48%)' }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '12px' }}>
                    <Check size={10} color="hsl(142, 70%, 55%)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'hsl(240 5% 65%)', lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: plan.primary ? 'hsl(205 90% 48%)' : 'hsl(240 6% 13%)', color: plan.primary ? 'white' : 'hsl(0 0% 78%)', borderRadius: '9px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', border: plan.primary ? 'none' : '1px solid hsl(240 6% 17%)' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px 72px', textAlign: 'center' }}>
        <div style={{ background: 'hsl(205 90% 48% / 0.06)', border: '1px solid hsl(205 90% 48% / 0.18)', borderRadius: '20px', padding: '40px 28px' }}>
          <h2 style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
            The only AI that gets smarter<br />the longer you use it
          </h2>
          <p style={{ fontSize: '14px', color: 'hsl(240 5% 52%)', marginBottom: '24px', lineHeight: 1.65 }}>
            Every task, chat and goal — Omnia remembers it all and works harder for you every day.
          </p>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '13px 30px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px hsl(205 90% 48% / 0.35)' }}>
            Start Free <ArrowRight size={16} />
          </Link>
          <p style={{ marginTop: '10px', fontSize: '12px', color: 'hsl(240 5% 34%)' }}>No card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid hsl(240 6% 11%)', padding: '20px', textAlign: 'center', fontSize: '12px', color: 'hsl(240 5% 34%)' }}>
        © {new Date().getFullYear()} Omnia ·{' '}
        <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link> ·{' '}
        <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
      </footer>
    </div>
  );
}
