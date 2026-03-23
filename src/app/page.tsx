import Link from 'next/link';
import {
  Sparkles, ArrowRight, Zap, Check, Brain, TrendingUp, MessageSquare,
  CalendarDays, FileText, Wand2, FileOutput, Receipt, Bell, DollarSign,
  Heart, FileSignature, Layers,
} from 'lucide-react';
import { StackWidget } from '@/components/landing/StackWidget';

const FEATURES = [
  { icon: Zap,           label: 'Autopilot',       desc: 'Chases invoices, finds gigs, drafts emails. Acts without being asked.',              color: '#38aaf5', bg: 'rgba(56,170,245,0.08)'   },
  { icon: Brain,         label: 'Memory Import',   desc: 'Upload your ChatGPT history. Omnia picks up exactly where you left off.',            color: '#c084fc', bg: 'rgba(192,132,252,0.08)' },
  { icon: MessageSquare, label: 'AI Assistant',    desc: '6 specialist modes. Writing, research, documents — all context-aware.',              color: '#38aaf5', bg: 'rgba(56,170,245,0.08)'   },
  { icon: Heart,         label: 'Life Hub',        desc: '22 tools for money and fitness. Budget, invest, train, eat — tracked in one place.', color: '#f472b6', bg: 'rgba(244,114,182,0.08)'  },
  { icon: DollarSign,    label: 'AI Money Tools',  desc: 'Lead magnets, SEO content, passive income plans — generated, not just suggested.',   color: '#34d399', bg: 'rgba(52,211,153,0.08)'   },
  { icon: CalendarDays,  label: 'Planner',         desc: 'Tasks, goals, habits. AI that prioritises based on your actual life.',               color: '#fbbf24', bg: 'rgba(251,191,36,0.08)'   },
  { icon: FileText,      label: 'Notes',           desc: 'Write it once. AI summarises, searches and organises it forever.',                   color: '#a78bfa', bg: 'rgba(167,139,250,0.08)'  },
  { icon: Wand2,         label: 'Content Studio',  desc: 'Social posts, blogs, scripts. Done in seconds, not hours.',                         color: '#fb923c', bg: 'rgba(251,146,60,0.08)'   },
  { icon: FileOutput,    label: 'Doc Builder',     desc: 'PDF, Word, Excel, PowerPoint. Export anything, instantly.',                         color: '#60a5fa', bg: 'rgba(96,165,250,0.08)'   },
  { icon: Receipt,       label: 'Invoices',        desc: 'Professional invoices that go out fast and get paid faster.',                        color: '#10b981', bg: 'rgba(16,185,129,0.08)'   },
  { icon: FileSignature, label: 'Proposals',       desc: 'AI-written proposals that actually sound like you wrote them.',                      color: '#e879f9', bg: 'rgba(232,121,249,0.08)'  },
  { icon: Bell,          label: 'Reminders',       desc: 'Set it and forget it. Omnia reminds you before things go wrong.',                    color: '#f87171', bg: 'rgba(248,113,113,0.08)'  },
  { icon: Sparkles,      label: 'AI Memory',       desc: 'The more you use it, the more it knows. Every response gets more personal.',         color: '#818cf8', bg: 'rgba(129,140,248,0.08)'  },
  { icon: TrendingUp,    label: 'AI Everywhere',   desc: 'Not bolted on — AI is built into every feature from the ground up.',                 color: '#34d399', bg: 'rgba(52,211,153,0.08)'   },
];

const PRICING_PLANS = [
  {
    name: 'Free', price: '$0', period: '', color: 'hsl(240 5% 55%)',
    features: ['Autopilot setup & persona', 'Memory Import (100 conversations)', '30 AI messages/month', 'Notes · Planner · Reminders · Files'],
    cta: 'Start Free', href: '/signup', primary: false,
  },
  {
    name: 'Plus', price: 'A$25', period: '/mo', sub: 'A$199/yr — save A$101', color: 'hsl(205,90%,60%)', highlight: true,
    features: ['Autopilot Level 1 (Draft + Send)', 'Morning briefing + opportunities', '500 AI messages/month', 'Life Hub — all 22 tools', 'AI Money Tools + Invoices + Proposals'],
    cta: 'Get Plus', href: '/signup?plan=plus', primary: true,
  },
  {
    name: 'Pro', price: 'A$40', period: '/mo', sub: 'A$329/yr — save A$151', color: 'hsl(262,83%,75%)',
    features: ['Full Autopilot — fully autonomous', 'Unlimited AI messages', 'Unlimited Memory Import', 'Everything in Plus'],
    cta: 'Get Pro', href: '/signup?plan=pro', primary: false,
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#080808', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#f0f0f0' }}>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .nav-links { display: flex; align-items: center; gap: 16px; }
        @media (max-width: 480px) {
          .nav-link-hide { display: none !important; }
          .nav-cta { padding: 7px 13px !important; font-size: 13px !important; }
        }
        .section-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: hsl(240 5% 38%);
        }
        .stats-row { display: flex; gap: 0; border: 1px solid hsl(240 6% 13%); border-radius: 14px; overflow: hidden; }
        .stat-item { flex: 1; padding: 16px; text-align: center; border-right: 1px solid hsl(240 6% 13%); }
        .stat-item:last-child { border-right: none; }
        @media (max-width: 500px) {
          .stats-row { display: grid; grid-template-columns: 1fr 1fr; }
          .stat-item:nth-child(2) { border-right: none; }
          .stat-item:nth-child(3) { border-top: 1px solid hsl(240 6% 13%); border-right: 1px solid hsl(240 6% 13%); }
          .stat-item:nth-child(4) { border-top: 1px solid hsl(240 6% 13%); }
        }
        .compare-outer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .compare-outer { grid-template-columns: 1fr; } }
        .compare-inner { background: hsl(240 8% 6%); border: 1px solid hsl(240 6% 13%); border-radius: 14px; overflow: hidden; }
        .compare-head { display: grid; grid-template-columns: 1fr 80px 90px; padding: 11px 14px; background: hsl(240 6% 9%); border-bottom: 1px solid hsl(240 6% 13%); }
        .compare-row  { display: grid; grid-template-columns: 1fr 80px 90px; padding: 10px 14px; align-items: center; }
        @media (max-width: 380px) {
          .compare-head { grid-template-columns: 1fr 60px 72px; padding: 10px; }
          .compare-row  { grid-template-columns: 1fr 60px 72px; padding: 10px; }
        }
        .ap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
        @media (max-width: 660px) { .ap-grid { grid-template-columns: 1fr; gap: 24px; } .ap-mockup-first { order: -1; } }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
        @media (max-width: 480px) { .features-grid { grid-template-columns: 1fr 1fr; } }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 700px) { .pricing-grid { grid-template-columns: 1fr; max-width: 380px; margin: 0 auto; } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ borderBottom: '1px solid hsl(240 6% 10%)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'hsl(205 90% 48%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em' }}>Omnia</span>
        </div>
        <div className="nav-links">
          <Link href="/pricing" className="nav-link-hide" style={{ fontSize: '13px', color: 'hsl(240 5% 48%)', textDecoration: 'none' }}>Pricing</Link>
          <Link href="/login" className="nav-link-hide" style={{ fontSize: '13px', color: 'hsl(240 5% 48%)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" className="nav-cta" style={{ padding: '8px 16px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(64px, 10vw, 120px) 24px 80px' }}>
        <p className="section-label" style={{ marginBottom: '32px' }}>Productivity software, rebuilt from scratch</p>

        <h1 style={{ fontSize: 'clamp(44px, 9vw, 92px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: '36px' }}>
          You don't need<br />
          <span style={{ color: 'hsl(205,90%,55%)' }}>another app.</span><br />
          You need one<br />
          that does all of it.
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2.2vw, 19px)', color: 'hsl(240 5% 50%)', maxWidth: '580px', marginBottom: '44px', lineHeight: 1.75 }}>
          You're paying for Notion. And Todoist. And ChatGPT. And probably something else you forgot to cancel.
          Four logins. Four subscriptions. Four times the friction.<br /><br />
          Omnia is the one that replaces all of them — and then goes further, taking real action on your behalf.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '64px' }}>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '10px', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Start for free <ArrowRight size={16} />
          </Link>
          <Link href="#replace-stack" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 22px', border: '1px solid hsl(240 6% 18%)', color: 'hsl(0 0% 72%)', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            <Layers size={14} /> Calculate your savings
          </Link>
        </div>

        <div className="stats-row" style={{ background: 'hsl(240 8% 6%)' }}>
          {[
            { value: '15',    label: 'features built in' },
            { value: '150+',  label: 'tools replaced' },
            { value: 'A$25',  label: 'from per month' },
            { value: '24/7',  label: 'Autopilot runtime' },
          ].map(s => (
            <div key={s.label} className="stat-item">
              <p style={{ fontSize: 'clamp(18px,4vw,24px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: 'hsl(240 5% 38%)', marginTop: '3px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Callout bar ── */}
      <div style={{ borderTop: '1px solid hsl(240 6% 10%)', borderBottom: '1px solid hsl(240 6% 10%)', padding: 'clamp(24px,4vw,36px) 24px', background: 'hsl(240 8% 5%)' }}>
        <p style={{ fontSize: 'clamp(15px, 2.2vw, 21px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(0 0% 58%)', textAlign: 'center', maxWidth: '700px', margin: '0 auto', lineHeight: 1.4 }}>
          Most people pay <span style={{ color: '#fff' }}>$100–$300/month</span> for apps that don't talk to each other.{' '}
          <span style={{ color: 'hsl(205,90%,60%)' }}>Omnia is A$25.</span>
        </p>
      </div>

      {/* ── Autopilot ── */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(64px,8vw,96px) 24px' }}>
        <p className="section-label" style={{ marginBottom: '20px' }}>Autopilot</p>
        <div className="ap-grid">
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '20px' }}>
              The only AI that acts<br />without being asked.
            </h2>
            <p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)', lineHeight: 1.75, marginBottom: '28px' }}>
              Every other AI tool waits for you to type something. Autopilot runs on a schedule —
              chasing invoices, finding opportunities, drafting content, briefing you every morning at 7am.
              It doesn't wait for permission. It just runs.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '32px' }}>
              {[
                'Chases unpaid invoices automatically',
                'Finds freelance gigs matching your skills',
                'Drafts follow-up emails and proposals',
                'Delivers a morning briefing every day at 7am',
                'Monitors your goals and flags what needs attention',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px' }}>
                  <Check size={14} color="hsl(142, 70%, 55%)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ color: 'hsl(0 0% 72%)', lineHeight: 1.5 }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 20px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '9px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
              Enable Autopilot <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mockup */}
          <div className="ap-mockup-first" style={{ background: 'hsl(240 8% 6%)', border: '1px solid hsl(240 6% 13%)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={13} color="hsl(205, 90%, 60%)" />
              <span style={{ fontWeight: 700, fontSize: '13px' }}>Today's Actions</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'hsl(142 70% 40% / 0.15)', color: 'hsl(142, 70%, 55%)', fontWeight: 700, animation: 'pulse 2s infinite' }}>3 ready</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Invoice Chase',     desc: 'Chase #INV-042 — overdue 7 days', color: 'hsl(142,70%,55%)', bg: 'hsl(142 70% 40%/0.06)', bd: 'hsl(142 70% 40%/0.18)' },
                { label: 'Content Ideas',     desc: '3 ideas ready for your LinkedIn',  color: 'hsl(262,83%,75%)', bg: 'hsl(262 83% 58%/0.06)', bd: 'hsl(262 83% 58%/0.18)' },
                { label: 'Opportunity Found', desc: 'React Developer gig — $85/hr',     color: 'hsl(38,95%,65%)',  bg: 'hsl(38 95% 60%/0.06)',  bd: 'hsl(38 95% 60%/0.18)'  },
              ].map(a => (
                <div key={a.label} style={{ padding: '12px 14px', background: a.bg, border: `1px solid ${a.bd}`, borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: a.color }}>{a.label}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'hsl(0 0% 65%)', marginBottom: '9px', lineHeight: 1.45 }}>{a.desc}</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ padding: '4px 10px', borderRadius: '5px', background: `${a.color}20`, border: `1px solid ${a.color}40`, color: a.color, fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                    <button style={{ padding: '4px 10px', borderRadius: '5px', background: 'transparent', border: '1px solid hsl(240 6% 18%)', color: 'hsl(240 5% 42%)', fontSize: '10px', cursor: 'pointer' }}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bold statement ── */}
      <div style={{ background: 'hsl(205 90% 48%)', padding: 'clamp(44px,7vw,80px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 'clamp(22px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.03em', color: 'white', maxWidth: '640px', margin: '0 auto', lineHeight: 1.15 }}>
          "ChatGPT tells you what to do.<br />Omnia just does it."
        </p>
      </div>

      {/* ── Replace Stack ── */}
      <section id="replace-stack" style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(64px,8vw,96px) 24px' }}>
        <p className="section-label" style={{ marginBottom: '20px' }}>Replace My Stack</p>
        <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '14px' }}>See exactly how much you'd save.</h2>
        <p style={{ fontSize: '14px', color: 'hsl(240 5% 46%)', marginBottom: '36px', maxWidth: '460px', lineHeight: 1.7 }}>
          Type the apps you currently pay for. We'll show you which ones Omnia replaces and what you'd keep in your pocket every month.
        </p>
        <StackWidget />
      </section>

      {/* ── Comparison ── */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px clamp(64px,8vw,96px)' }}>
        <p className="section-label" style={{ marginBottom: '20px' }}>How it stacks up</p>
        <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '32px' }}>ChatGPT answers. Omnia acts.</h2>
        <div className="compare-outer">
          <div className="compare-inner">
            <div className="compare-head">
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 38%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 42%)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>ChatGPT</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(205,90%,60%)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Omnia</span>
            </div>
            {[
              ['Acts without prompting', '✗', '✓'],
              ['Remembers who you are',  '✗', '✓'],
              ['Takes real actions',     '✗', '✓'],
              ['Knows your context',     '✗', '✓'],
              ['Runs while you sleep',   '✗', '✓'],
            ].map(([feat, bad, good], i) => (
              <div key={i} className="compare-row" style={{ borderTop: '1px solid hsl(240 6% 10%)' }}>
                <span style={{ fontSize: '12px', color: 'hsl(0 0% 68%)' }}>{feat}</span>
                <span style={{ fontSize: '14px', color: 'hsl(0 60% 52%)', textAlign: 'center', fontWeight: 700 }}>{bad}</span>
                <span style={{ fontSize: '14px', color: 'hsl(142,70%,55%)', textAlign: 'center', fontWeight: 700 }}>{good}</span>
              </div>
            ))}
          </div>
          <div className="compare-inner">
            <div className="compare-head">
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 38%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 42%)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>10 apps</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(205,90%,60%)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Omnia</span>
            </div>
            {[
              ['Monthly cost',      '$50–$300+', 'A$25–A$40'],
              ['Setup required',    'Yes, each', 'No'],
              ['Context switching', 'Constant',  'Zero'],
              ['AI across all',     'Maybe',     'Always'],
              ['Works together',    'Never',     'Always'],
            ].map(([feat, bad, good], i) => (
              <div key={i} className="compare-row" style={{ borderTop: '1px solid hsl(240 6% 10%)' }}>
                <span style={{ fontSize: '12px', color: 'hsl(0 0% 68%)' }}>{feat}</span>
                <span style={{ fontSize: '11px', color: 'hsl(0 60% 58%)', textAlign: 'center', fontWeight: 600 }}>{bad}</span>
                <span style={{ fontSize: '11px', color: 'hsl(142,70%,55%)', textAlign: 'center', fontWeight: 600 }}>{good}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: '1020px', margin: '0 auto', padding: '0 24px clamp(64px,8vw,96px)' }}>
        <p className="section-label" style={{ marginBottom: '20px' }}>What's included</p>
        <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '10px' }}>15 tools. One subscription.</h2>
        <p style={{ fontSize: '14px', color: 'hsl(240 5% 44%)', marginBottom: '32px', lineHeight: 1.6 }}>
          Everything you currently use separately — now in one place, all talking to each other.
        </p>
        <div className="features-grid">
          {FEATURES.map((f: any) => (
            <div key={f.label} style={{ padding: '18px', background: 'hsl(240 6% 6%)', border: '1px solid hsl(240 6% 11%)', borderRadius: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <f.icon size={17} color={f.color} />
              </div>
              <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: '#e0e0e0' }}>{f.label}</p>
              <p style={{ fontSize: '11.5px', color: 'hsl(240 5% 42%)', lineHeight: 1.55 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ maxWidth: '880px', margin: '0 auto', padding: '0 24px clamp(64px,8vw,96px)' }}>
        <p className="section-label" style={{ marginBottom: '20px' }}>Pricing</p>
        <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '10px' }}>Less than one app. All of them.</h2>
        <p style={{ fontSize: '14px', color: 'hsl(240 5% 44%)', marginBottom: '36px', lineHeight: 1.6 }}>
          Start free. From A$25/mo you get more than your entire current stack.
        </p>
        <div className="pricing-grid">
          {PRICING_PLANS.map(plan => (
            <div key={plan.name} style={{ padding: '24px 20px', background: 'hsl(240 8% 6%)', border: `1px solid ${plan.highlight ? 'hsl(205 90% 48% / 0.5)' : 'hsl(240 6% 12%)'}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: '999px', background: 'hsl(205, 90%, 48%)', color: 'white', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.08em' }}>
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: plan.color, marginBottom: '6px' }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' }}>
                <span style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>{plan.price}</span>
                <span style={{ fontSize: '12px', color: 'hsl(240 5% 40%)' }}>{plan.period}</span>
              </div>
              <p style={{ fontSize: '11px', color: (plan as any).sub ? '#34d399' : 'transparent', marginBottom: '16px', fontWeight: 500, minHeight: '16px' }}>
                {(plan as any).sub ?? ''}
              </p>
              <ul style={{ listStyle: 'none', margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                    <Check size={10} color="hsl(142, 70%, 55%)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'hsl(240 5% 58%)', lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px', background: plan.primary ? 'hsl(205 90% 48%)' : 'hsl(240 6% 11%)', color: plan.primary ? 'white' : 'hsl(0 0% 70%)', borderRadius: '9px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', border: plan.primary ? 'none' : '1px solid hsl(240 6% 16%)' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px clamp(80px,10vw,120px)', textAlign: 'center' }}>
        <p className="section-label" style={{ marginBottom: '24px' }}>Get started today</p>
        <h2 style={{ fontSize: 'clamp(36px,7vw,64px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: '24px' }}>
          You already know<br />you need this.
        </h2>
        <p style={{ fontSize: '16px', color: 'hsl(240 5% 46%)', marginBottom: '36px', lineHeight: 1.75, maxWidth: '400px', margin: '0 auto 36px' }}>
          Stop paying for apps that don't talk to each other.<br />One login. Everything works together.
        </p>
        <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '15px 32px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '12px', fontSize: '16px', fontWeight: 800, textDecoration: 'none' }}>
          Start for free <ArrowRight size={17} />
        </Link>
        <p style={{ marginTop: '14px', fontSize: '12px', color: 'hsl(240 5% 28%)' }}>No card required · Cancel anytime</p>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid hsl(240 6% 10%)', padding: '24px', textAlign: 'center', fontSize: '12px', color: 'hsl(240 5% 28%)' }}>
        © {new Date().getFullYear()} Omnia ·{' '}
        <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link> ·{' '}
        <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
      </footer>
    </div>
  );
}
