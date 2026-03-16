import Link from 'next/link';
import {
  Sparkles, MessageSquare, CalendarDays, FileText, Wand2, FileOutput,
  Receipt, Bell, ArrowRight, DollarSign, Heart, FileSignature,
  Brain, TrendingUp, Dumbbell, Check,
} from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare,  label: 'AI Assistant',      desc: '6 specialist modes — writing, planning, study, documents & more',  color: '#38aaf5', bg: 'rgba(56,170,245,0.1)'   },
  { icon: Heart,          label: 'Life Hub',           desc: '22 tools for finance & fitness — budget, invest, train, eat',       color: '#f472b6', bg: 'rgba(244,114,182,0.1)'  },
  { icon: DollarSign,     label: 'AI Money Tools',     desc: 'Lead magnets, SEO blogs, email sequences & passive income plans',   color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  { icon: CalendarDays,   label: 'Planner',            desc: 'Tasks, goals & habits with AI-powered prioritisation',              color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  { icon: FileText,       label: 'Notes',              desc: 'AI-powered summaries, smart search and folder organisation',        color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { icon: Wand2,          label: 'Content Studio',     desc: 'Social posts, captions, blogs, scripts — done in seconds',         color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  { icon: FileOutput,     label: 'Doc Builder',        desc: 'Export to PDF, Word, Excel and PowerPoint in one click',           color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  { icon: Receipt,        label: 'Invoices',           desc: 'Professional PDF invoices — create, send and chase payment',       color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  { icon: FileSignature,  label: 'Proposals',          desc: 'AI-written client proposals that win more business',               color: '#e879f9', bg: 'rgba(232,121,249,0.1)' },
  { icon: Bell,           label: 'Reminders',          desc: 'Smart reminders with recurrence — never miss a deadline',         color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { icon: Brain,          label: 'AI Memory',          desc: 'Omnia learns about you so every response feels personal',          color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  { icon: Sparkles,       label: 'AI Everywhere',      desc: 'Summaries, suggestions and AI inside every feature',              color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
];

const LIFE_HUB_EXAMPLES = [
  { emoji: '📊', label: 'Budget Planner' },    { emoji: '📈', label: 'Investment Ideas' },
  { emoji: '🔓', label: 'Debt Payoff' },        { emoji: '❤️‍🔥', label: 'Financial Health Score' },
  { emoji: '🏋️', label: 'Workout Planner' },   { emoji: '🥗', label: 'Meal Planner' },
  { emoji: '🔢', label: 'Calorie Tracker' },    { emoji: '🏆', label: '30-Day Challenges' },
];

const REPLACES = [
  'ChatGPT', 'Notion', 'Todoist', 'MyFitnessPal', 'YNAB', 'Calendly',
  'Canva (content)', 'FreshBooks (invoices)', 'Mailchimp (emails)', 'Typeform (proposals)',
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
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.2)', marginBottom: '24px' }}>
          <Sparkles size={12} color="hsl(205, 90%, 48%)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(205, 90%, 48%)' }}>One subscription — AI assistant, life tools & content creation</span>
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.03em' }}>
          The only AI app{' '}
          <span style={{ background: 'linear-gradient(135deg, hsl(205,90%,60%), hsl(262,83%,75%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            you'll ever need
          </span>
        </h1>
        <p style={{ fontSize: '18px', color: 'hsl(240 5% 55%)', maxWidth: '600px', margin: '0 auto 16px', lineHeight: 1.65 }}>
          AI Assistant, Finance Planner, Fitness Coach, Content Studio, Invoices & more — all in one beautiful app. Stop paying for ten tools.
        </p>

        {/* Social proof / REPLACES row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '12px', color: 'hsl(240 5% 40%)', alignSelf: 'center' }}>Replaces:</span>
          {REPLACES.map(r => (
            <span key={r} style={{ fontSize: '11px', padding: '3px 10px', background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '999px', color: 'hsl(240 5% 55%)' }}>
              {r}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '12px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px hsl(205 90% 48% / 0.3)' }}>
            Start Free — No Card Required <ArrowRight size={18} />
          </Link>
          <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', border: '1px solid hsl(240 6% 18%)', color: 'hsl(0 0% 90%)', borderRadius: '12px', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
            View Pricing
          </Link>
        </div>
        <p style={{ marginTop: '14px', fontSize: '13px', color: 'hsl(240 5% 38%)' }}>Free plan available · 7-day Pro trial · Cancel anytime</p>
      </section>

      {/* ── Life Hub spotlight ── */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ background: 'hsl(240 6% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '20px', padding: '36px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, hsl(205 90% 48% / 0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'hsl(340 80% 55% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Heart size={22} color="hsl(340, 80%, 65%)" />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px' }}>New: Life Hub</h2>
              <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', margin: 0, maxWidth: '520px' }}>
                22 AI-powered tools for your finances and fitness in one place. Budget planners, investment ideas, workout programmes, meal plans and more — all personalised to you.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {LIFE_HUB_EXAMPLES.map(({ emoji, label }) => (
              <div key={label} style={{ padding: '12px', background: 'hsl(240 6% 10%)', borderRadius: '10px', border: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{emoji}</span>
                <span style={{ fontSize: '12px', color: 'hsl(240 5% 65%)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '20px', padding: '10px 20px', background: 'hsl(340 80% 55% / 0.15)', border: '1px solid hsl(340 80% 55% / 0.3)', borderRadius: '10px', color: 'hsl(340,80%,70%)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            Try Life Hub free <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Everything in one place</h2>
          <p style={{ fontSize: '16px', color: 'hsl(240 5% 55%)' }}>12 powerful features, one subscription, zero juggling between apps.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{ padding: '20px', background: 'hsl(240 6% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '14px' }}>
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
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
        <div style={{ background: 'hsl(205 90% 48% / 0.06)', border: '1px solid hsl(205 90% 48% / 0.2)', borderRadius: '20px', padding: '40px 32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.2)', marginBottom: '20px' }}>
            <TrendingUp size={12} color="hsl(205, 90%, 60%)" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(205, 90%, 60%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Separate tools cost £10–40/month each</span>
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Get everything for <span style={{ color: 'hsl(205, 90%, 60%)' }}>£25/month</span></h2>
          <p style={{ fontSize: '15px', color: 'hsl(240 5% 55%)', marginBottom: '28px', lineHeight: 1.65 }}>
            One subscription replaces your AI assistant, productivity planner, finance tools, content studio, invoicing, and more.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '320px', margin: '0 auto 28px' }}>
            {['Start free — no card required', '22 Life Hub tools included', 'AI Money Tools suite', 'Unlimited AI assistant', 'Export to PDF, Word & Excel'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'hsl(142 70% 40% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color="hsl(142, 70%, 55%)" />
                </div>
                <span style={{ fontSize: '14px', color: 'hsl(0 0% 80%)', textAlign: 'left' }}>{item}</span>
              </div>
            ))}
          </div>
          <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            See pricing <ArrowRight size={16} />
          </Link>
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
