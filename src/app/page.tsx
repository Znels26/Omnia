import Link from 'next/link';
import { Sparkles, MessageSquare, CalendarDays, FileText, Wand2, FileOutput, Receipt, Bell, ArrowRight, Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'hsl(240 10% 4%)' }}>
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
          <Link href="/signup" style={{ padding: '8px 16px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.2)', marginBottom: '24px' }}>
          <Sparkles size={12} color="hsl(205, 90%, 48%)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(205, 90%, 48%)' }}>One subscription, everything you need</span>
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.03em' }}>
          The AI app that{' '}
          <span className="gradient-text">replaces them all</span>
        </h1>
        <p style={{ fontSize: '18px', color: 'hsl(240 5% 55%)', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          AI Assistant, Planner, Notes, Content Studio, Document Builder — all in one beautiful app. Stop paying for five tools.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '12px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px hsl(205 90% 48% / 0.3)' }}>
            Start Free — No Card Required <ArrowRight size={18} />
          </Link>
          <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', border: '1px solid hsl(240 6% 14%)', color: 'hsl(0 0% 90%)', borderRadius: '12px', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>
            View Pricing
          </Link>
        </div>
        <p style={{ marginTop: '16px', fontSize: '13px', color: 'hsl(240 5% 40%)' }}>Free plan available · 7-day Pro trial · Cancel anytime</p>
      </section>

      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { icon: MessageSquare, label: 'AI Assistant', desc: '6 specialist modes', color: '#38aaf5', bg: 'rgba(56,170,245,0.1)' },
            { icon: CalendarDays, label: 'Planner', desc: 'Tasks, goals & habits', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
            { icon: FileText, label: 'Notes', desc: 'AI-powered summaries', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
            { icon: Wand2, label: 'Content Studio', desc: 'Posts, captions, blogs', color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
            { icon: FileOutput, label: 'Doc Builder', desc: 'PDF, Word, Excel, PPT', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
            { icon: Receipt, label: 'Invoices', desc: 'Professional PDF invoices', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { icon: Bell, label: 'Reminders', desc: 'Never miss a thing', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
            { icon: Sparkles, label: 'AI Everywhere', desc: 'Summaries in every feature', color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
          ].map(f => (
            <div key={f.label} className="card" style={{ padding: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <f.icon size={20} color={f.color} />
              </div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>{f.label}</p>
              <p style={{ fontSize: '13px', color: 'hsl(240 5% 55%)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: '1px solid hsl(240 6% 14%)', padding: '24px', textAlign: 'center', fontSize: '13px', color: 'hsl(240 5% 40%)' }}>
        © {new Date().getFullYear()} Omnia · <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link> · <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
      </footer>
    </div>
  );
}
