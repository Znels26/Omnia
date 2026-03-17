import Link from 'next/link';
import {
  Sparkles, ArrowRight, Zap, Bot, Check, Brain, TrendingUp, MessageSquare,
  CalendarDays, FileText, Wand2, FileOutput, Receipt, Bell, DollarSign,
  Heart, FileSignature, Code2, Shield, Star, ChevronRight,
} from 'lucide-react';

const FEATURES = [
  { icon: Zap,           label: 'Autopilot',        desc: 'Your AI Chief of Staff — works overnight so you wake up to a done list',       color: '#38aaf5', bg: 'rgba(56,170,245,0.1)'   },
  { icon: Brain,         label: 'Memory Import',     desc: 'Upload your ChatGPT or Claude history — Omnia instantly knows everything about you', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  { icon: MessageSquare, label: 'AI Assistant',      desc: '6 specialist modes — writing, planning, study, documents & more',              color: '#38aaf5', bg: 'rgba(56,170,245,0.1)'   },
  { icon: Heart,         label: 'Life Hub',          desc: '22 tools for finance & fitness — budget, invest, train, eat',                  color: '#f472b6', bg: 'rgba(244,114,182,0.1)'  },
  { icon: DollarSign,    label: 'AI Money Tools',    desc: 'Lead magnets, SEO blogs, email sequences & passive income plans',              color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  { icon: CalendarDays,  label: 'Planner',           desc: 'Tasks, goals & habits with AI-powered prioritisation',                        color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  { icon: FileText,      label: 'Notes',             desc: 'AI-powered summaries, smart search and folder organisation',                  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { icon: Wand2,         label: 'Content Studio',    desc: 'Social posts, captions, blogs, scripts — done in seconds',                   color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  { icon: FileOutput,    label: 'Doc Builder',       desc: 'Export to PDF, Word, Excel and PowerPoint in one click',                     color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  { icon: Receipt,       label: 'Invoices',          desc: 'Professional PDF invoices — create, send and chase payment',                 color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  { icon: FileSignature, label: 'Proposals',         desc: 'AI-written client proposals that win more business',                         color: '#e879f9', bg: 'rgba(232,121,249,0.1)' },
  { icon: Bell,          label: 'Reminders',         desc: 'Smart reminders with recurrence — never miss a deadline',                   color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { icon: Code2,         label: 'Code Studio',       desc: 'Full IDE with Monaco, live preview, AI codegen & Vercel deploy',            color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', pro: true },
  { icon: Sparkles,      label: 'AI Memory',         desc: 'Omnia learns about you so every response feels personal',                   color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
  { icon: TrendingUp,    label: 'AI Everywhere',     desc: 'Summaries, suggestions and AI inside every feature',                        color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
];

const PERSONAS = [
  { emoji: '⚡', name: 'The Hustler',   desc: 'Chase invoices, find gigs, grow your income on autopilot',  color: '#38aaf5' },
  { emoji: '💪', name: 'The Optimiser', desc: 'Hit your fitness and nutrition goals without thinking twice', color: '#34d399' },
  { emoji: '🏗️', name: 'The Builder',   desc: 'Ship your product, manage leads, draft your copy daily',    color: '#fbbf24' },
  { emoji: '🎨', name: 'The Creator',   desc: 'Wake up to fresh content ideas, captions and scripts',       color: '#e879f9' },
  { emoji: '📚', name: 'The Learner',   desc: 'Daily study briefs, note summaries and learning plans',      color: '#a78bfa' },
  { emoji: '💼', name: 'The Operator',  desc: 'Automate your ops, proposals and client follow-ups',         color: '#fb923c' },
  { emoji: '🌱', name: 'The Starter',   desc: 'Build confidence, habits and momentum from day one',         color: '#c084fc' },
];

const PRICING_PLANS = [
  {
    name: 'Free', price: '$0', period: '', color: 'hsl(240 5% 55%)',
    features: [
      'Autopilot onboarding & persona setup',
      'Memory Import (up to 100 conversations)',
      'No autonomous actions (upgrade to unlock)',
      '30 AI messages/month',
      '20 notes · 10 uploads · 5 exports',
    ],
    cta: 'Start Free', href: '/signup', primary: false,
  },
  {
    name: 'Plus', price: '$24', period: '/mo', color: 'hsl(205,90%,60%)', highlight: true,
    features: [
      '✓ Autopilot Level 1 (Draft Only)',
      '✓ Morning briefing + opportunity finder',
      '✓ Memory Import (500 conversations)',
      '✓ All 7 Autopilot personas',
      '500 AI messages/month',
      'Life Hub — all 22 tools',
      'AI Money Tools · Invoices · Proposals',
    ],
    cta: 'Get Plus', href: '/signup?plan=plus', primary: true,
  },
  {
    name: 'Pro', price: '$49', period: '/mo', color: 'hsl(262,83%,75%)',
    features: [
      '✓ Full Autopilot (all 3 permission levels)',
      '✓ Fully autonomous operation',
      '✓ All persona-specific daily actions',
      '✓ Unlimited Memory Import',
      '✓ Priority Autopilot processing',
      '✓ Life coach mode + mental load reducer',
      'Unlimited AI messages & everything',
    ],
    cta: 'Get Pro', href: '/signup?plan=pro', primary: false,
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'hsl(240 10% 4%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: 'hsl(0 0% 90%)' }}>

      {/* ── Nav ── */}
      <nav style={{ borderBottom: '1px solid hsl(240 6% 14%)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'hsl(240 10% 4% / 0.95)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="hsl(205, 90%, 48%)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '18px' }}>Omnia</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/pricing" style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', textDecoration: 'none' }}>Pricing</Link>
          <Link href="/login" style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ padding: '8px 18px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: '820px', margin: '0 auto', padding: '80px 24px 70px', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 16px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.25)', marginBottom: '28px' }}>
          <Zap size={13} color="hsl(205, 90%, 60%)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(205, 90%, 60%)' }}>New: Omnia Autopilot — Your AI works while you sleep</span>
        </div>

        <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 400, lineHeight: 1.08, marginBottom: '22px', letterSpacing: '-0.03em' }}>
          The AI that works<br />
          <span style={{ fontWeight: 800, background: 'linear-gradient(135deg, hsl(205,90%,60%), hsl(262,83%,75%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            while you sleep
          </span>
        </h1>

        <p style={{ fontSize: '19px', color: 'hsl(240 5% 55%)', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.65 }}>
          Stop using AI. Start having AI work for you. Omnia Autopilot runs overnight so you wake up to a done list, not a to-do list.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 30px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '12px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px hsl(205 90% 48% / 0.35)' }}>
            Start Free <ArrowRight size={18} />
          </Link>
          <Link href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 30px', border: '1px solid hsl(240 6% 18%)', color: 'hsl(0 0% 88%)', borderRadius: '12px', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
            See How It Works
          </Link>
        </div>

        <p style={{ fontSize: '13px', color: 'hsl(240 5% 40%)' }}>
          Join thousands of freelancers, creators and business owners
        </p>
      </section>

      {/* ── Autopilot Feature Section ── */}
      <section id="how-it-works" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '24px', padding: '48px', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          {/* Blue glow right */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', background: 'radial-gradient(circle, hsl(205 90% 48% / 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Left */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.12)', border: '1px solid hsl(205 90% 48% / 0.25)', marginBottom: '20px' }}>
              <Zap size={12} color="hsl(205, 90%, 60%)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(205, 90%, 60%)' }}>Autopilot</span>
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Your AI Chief of Staff</h2>
            <p style={{ fontSize: '15px', color: 'hsl(240 5% 55%)', lineHeight: 1.65, marginBottom: '22px' }}>
              Omnia works overnight so you wake up to a done list, not a to-do list.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Chases your unpaid invoices automatically',
                'Finds freelance opportunities matching your skills',
                'Drafts your follow-up emails',
                'Generates your content ideas every morning',
                'Monitors your financial goals in real time',
                'Briefs you every morning at 7am',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'hsl(142 70% 40% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    <Check size={10} color="hsl(142, 70%, 55%)" />
                  </div>
                  <span style={{ color: 'hsl(0 0% 80%)', lineHeight: 1.5 }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
              Enable Autopilot <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right — Autopilot dashboard mockup */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'hsl(240 10% 4%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '16px', padding: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Zap size={14} color="hsl(205, 90%, 60%)" />
                <span style={{ fontWeight: 700, fontSize: '13px' }}>Today's Actions</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'hsl(142 70% 40% / 0.15)', color: 'hsl(142, 70%, 55%)', fontWeight: 600 }}>3 ready</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Action 1 */}
                <div style={{ padding: '14px', background: 'hsl(142 70% 40% / 0.06)', border: '1px solid hsl(142 70% 40% / 0.2)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(142, 70%, 55%)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(142, 70%, 60%)' }}>Invoice Chase</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'hsl(0 0% 75%)', margin: '0 0 10px', lineHeight: 1.4 }}>Chase Invoice #INV-042 — overdue by 7 days</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ padding: '4px 10px', borderRadius: '6px', background: 'hsl(142 70% 40% / 0.2)', border: '1px solid hsl(142 70% 40% / 0.3)', color: 'hsl(142, 70%, 60%)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                    <button style={{ padding: '4px 10px', borderRadius: '6px', background: 'transparent', border: '1px solid hsl(240 6% 20%)', color: 'hsl(240 5% 50%)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
                  </div>
                </div>
                {/* Action 2 */}
                <div style={{ padding: '14px', background: 'hsl(262 83% 58% / 0.06)', border: '1px solid hsl(262 83% 58% / 0.2)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(262, 83%, 75%)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(262, 83%, 75%)' }}>Content Ideas</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'hsl(0 0% 75%)', margin: '0 0 10px', lineHeight: 1.4 }}>3 content ideas ready for your LinkedIn</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ padding: '4px 10px', borderRadius: '6px', background: 'hsl(262 83% 58% / 0.2)', border: '1px solid hsl(262 83% 58% / 0.3)', color: 'hsl(262, 83%, 75%)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                    <button style={{ padding: '4px 10px', borderRadius: '6px', background: 'transparent', border: '1px solid hsl(240 6% 20%)', color: 'hsl(240 5% 50%)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
                  </div>
                </div>
                {/* Action 3 */}
                <div style={{ padding: '14px', background: 'hsl(38 95% 60% / 0.06)', border: '1px solid hsl(38 95% 60% / 0.2)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(38, 95%, 60%)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(38, 95%, 65%)' }}>Opportunity Found</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'hsl(0 0% 75%)', margin: '0 0 10px', lineHeight: 1.4 }}>Freelance gig found: React Developer — $85/hr</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ padding: '4px 10px', borderRadius: '6px', background: 'hsl(38 95% 60% / 0.2)', border: '1px solid hsl(38 95% 60% / 0.3)', color: 'hsl(38, 95%, 65%)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                    <button style={{ padding: '4px 10px', borderRadius: '6px', background: 'transparent', border: '1px solid hsl(240 6% 20%)', color: 'hsl(240 5% 50%)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison: Autopilot vs ChatGPT ── */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Why Autopilot beats a chatbot</h2>
          <p style={{ fontSize: '15px', color: 'hsl(240 5% 55%)' }}>ChatGPT waits for you. Omnia works for you.</p>
        </div>
        <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', background: 'hsl(240 6% 10%)', borderBottom: '1px solid hsl(240 6% 14%)', padding: '14px 20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>ChatGPT</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(205, 90%, 60%)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Omnia Autopilot</span>
          </div>
          {[
            { feat: 'You think of what to ask', chatgpt: '✓ required', omnia: '✗ you don\'t need to' },
            { feat: 'Forgets you every session', chatgpt: '✓ yes', omnia: '✗ remembers everything' },
            { feat: 'Generic answers', chatgpt: '✓ yes', omnia: '✗ personalised to your life' },
            { feat: 'You take action yourself', chatgpt: '✓ always', omnia: '✗ Omnia prepares the actions' },
            { feat: 'No proactive help', chatgpt: '✓ waits for you', omnia: '✗ works while you sleep' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', padding: '14px 20px', borderBottom: i < 4 ? '1px solid hsl(240 6% 12%)' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'hsl(0 0% 78%)' }}>{row.feat}</span>
              <span style={{ fontSize: '12px', color: 'hsl(0 60% 55%)', textAlign: 'center', fontWeight: 600 }}>{row.chatgpt}</span>
              <span style={{ fontSize: '12px', color: 'hsl(142, 70%, 55%)', textAlign: 'center', fontWeight: 600 }}>{row.omnia}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Memory Import Feature Section ── */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '24px', padding: '48px', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          {/* Purple glow left */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '400px', height: '400px', background: 'radial-gradient(circle, hsl(262 83% 58% / 0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Left — terminal mockup */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'hsl(240 10% 4%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '14px', padding: '20px', fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: '📂', text: 'Loading ChatGPT export…', done: true },
                  { icon: '🧠', text: 'Extracting 847 conversations…', done: true },
                  { icon: '💪', text: 'Found: fitness goals & routines', done: true },
                  { icon: '💰', text: 'Found: financial goals & targets', done: true },
                  { icon: '✍️', text: 'Found: writing style & voice', done: true },
                  { icon: '⚡', text: 'Autopilot ready to personalise', done: false },
                ].map((line, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{line.icon}</span>
                    <span style={{ color: line.done ? 'hsl(142, 70%, 55%)' : 'hsl(205, 90%, 60%)', flex: 1 }}>{line.text}</span>
                    {line.done && <span style={{ color: 'hsl(142, 70%, 55%)' }}>✓</span>}
                    {!line.done && <span style={{ color: 'hsl(205, 90%, 60%)', animation: 'none' }}>…</span>}
                  </div>
                ))}
                <div style={{ marginTop: '8px', height: '1px', background: 'hsl(240 6% 14%)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'hsl(262, 83%, 75%)' }}>▶</span>
                  <span style={{ color: 'hsl(262, 83%, 75%)', fontWeight: 700 }}>Import complete — Omnia knows you.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '999px', background: 'hsl(262 83% 58% / 0.12)', border: '1px solid hsl(262 83% 58% / 0.25)', marginBottom: '20px' }}>
              <Brain size={12} color="hsl(262, 83%, 75%)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(262, 83%, 75%)' }}>Memory Import</span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 34px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Switching to Omnia takes 30 seconds</h2>
            <p style={{ fontSize: '15px', color: 'hsl(240 5% 55%)', lineHeight: 1.65, marginBottom: '22px' }}>
              Upload your ChatGPT or Claude history and Omnia instantly knows everything about you. Goals, habits, preferences — imported automatically.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Fitness goals and workout preferences',
                'Financial goals and budget targets',
                'Tasks, projects and priorities',
                'Your writing style and tone of voice',
                'Interests, topics and passions',
                'Everything you\'ve ever researched',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'hsl(262 83% 58% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    <Check size={10} color="hsl(262, 83%, 75%)" />
                  </div>
                  <span style={{ color: 'hsl(0 0% 80%)', lineHeight: 1.5 }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: 'hsl(262 83% 58% / 0.15)', border: '1px solid hsl(262 83% 58% / 0.3)', color: 'hsl(262, 83%, 75%)', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
              Import My History <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Comparison: Omnia vs OpenClaw ── */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Omnia vs the alternatives</h2>
          <p style={{ fontSize: '15px', color: 'hsl(240 5% 55%)' }}>No technical setup. No hidden API costs. Built for everyone.</p>
        </div>
        <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', background: 'hsl(240 6% 10%)', borderBottom: '1px solid hsl(240 6% 14%)', padding: '14px 20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(240 5% 45%)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>OpenClaw</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(205, 90%, 60%)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Omnia</span>
          </div>
          {[
            { feat: 'Technical setup required', other: 'Yes', omnia: 'No' },
            { feat: 'Needs your computer running 24/7', other: 'Yes', omnia: 'No' },
            { feat: 'API costs', other: 'Up to $150/mo', omnia: 'Included' },
            { feat: 'Built for', other: 'Developers only', omnia: 'Everyone' },
            { feat: 'Interface', other: 'No UI — just chat', omnia: 'Beautiful full app' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', padding: '14px 20px', borderBottom: i < 4 ? '1px solid hsl(240 6% 12%)' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'hsl(0 0% 78%)' }}>{row.feat}</span>
              <span style={{ fontSize: '12px', color: 'hsl(0 60% 55%)', textAlign: 'center', fontWeight: 600 }}>{row.other}</span>
              <span style={{ fontSize: '12px', color: 'hsl(142, 70%, 55%)', textAlign: 'center', fontWeight: 600 }}>{row.omnia}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7 Personas ── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Which version of Omnia are you?</h2>
          <p style={{ fontSize: '16px', color: 'hsl(240 5% 55%)' }}>Autopilot adapts completely to your goals and lifestyle.</p>
        </div>
        <style>{`
          .personas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          @media (max-width: 720px) { .personas-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 480px) { .personas-grid { grid-template-columns: 1fr; } }
        `}</style>
        <div className="personas-grid">
          {PERSONAS.map(p => (
            <div key={p.name} style={{ padding: '24px', background: 'hsl(240 8% 7%)', border: `1px solid ${p.color}28`, borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `radial-gradient(circle, ${p.color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{p.emoji}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: p.color }}>{p.name}</h3>
              <p style={{ fontSize: '13px', color: 'hsl(240 5% 55%)', margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Everything in one place</h2>
          <p style={{ fontSize: '16px', color: 'hsl(240 5% 55%)' }}>15 powerful features, one subscription, zero juggling between apps.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
          {FEATURES.map((f: any) => (
            <div key={f.label} style={{ padding: '20px', background: 'hsl(240 6% 7%)', border: `1px solid ${f.pro ? 'hsl(262 83% 58% / 0.2)' : 'hsl(240 6% 14%)'}`, borderRadius: '14px', position: 'relative' }}>
              {f.pro && (
                <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'hsl(262 83% 58% / 0.15)', color: 'hsl(262,83%,75%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro</span>
              )}
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <f.icon size={19} color={f.color} />
              </div>
              <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '5px' }}>{f.label}</p>
              <p style={{ fontSize: '12.5px', color: 'hsl(240 5% 50%)', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing callout ── */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Autopilot included from Plus</h2>
          <p style={{ fontSize: '16px', color: 'hsl(240 5% 55%)' }}>Start free. Unlock autonomous actions when you're ready.</p>
        </div>
        <style>{`
          .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          @media (max-width: 720px) { .pricing-grid { grid-template-columns: 1fr; } }
        `}</style>
        <div className="pricing-grid">
          {PRICING_PLANS.map(plan => (
            <div key={plan.name} style={{ padding: '28px 22px', background: 'hsl(240 8% 7%)', border: `1px solid ${plan.highlight ? 'hsl(205 90% 48% / 0.4)' : 'hsl(240 6% 14%)'}`, borderRadius: '18px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: plan.highlight ? '0 0 40px hsl(205 90% 48% / 0.08)' : 'none' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: '999px', background: 'hsl(205, 90%, 48%)', color: 'white', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: plan.color, marginBottom: '6px' }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>{plan.price}</span>
                <span style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px' }}>
                    <Check size={12} color="hsl(142, 70%, 55%)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'hsl(240 5% 68%)', lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px', background: plan.primary ? 'hsl(205 90% 48%)' : 'hsl(240 6% 14%)', color: plan.primary ? 'white' : 'hsl(0 0% 80%)', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', border: plan.primary ? 'none' : '1px solid hsl(240 6% 18%)' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px 100px', textAlign: 'center' }}>
        <div style={{ background: 'hsl(205 90% 48% / 0.06)', border: '1px solid hsl(205 90% 48% / 0.18)', borderRadius: '24px', padding: '52px 36px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '14px' }}>
            The only AI that gets smarter<br />the longer you use it
          </h2>
          <p style={{ fontSize: '16px', color: 'hsl(240 5% 55%)', marginBottom: '32px', lineHeight: 1.65 }}>
            Every conversation, every task, every goal — Omnia remembers it all and works harder for you every day.
          </p>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 36px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '14px', fontSize: '17px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 28px hsl(205 90% 48% / 0.35)' }}>
            Start Free <ArrowRight size={20} />
          </Link>
          <p style={{ marginTop: '14px', fontSize: '13px', color: 'hsl(240 5% 38%)' }}>Free plan available · No card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid hsl(240 6% 12%)', padding: '24px', textAlign: 'center', fontSize: '13px', color: 'hsl(240 5% 38%)' }}>
        © {new Date().getFullYear()} Omnia ·{' '}
        <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link> ·{' '}
        <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
      </footer>
    </div>
  );
}
