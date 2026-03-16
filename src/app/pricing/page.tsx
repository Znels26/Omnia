import Link from 'next/link';
import { Sparkles, Check, ArrowRight, Zap, Crown, X } from 'lucide-react';

export const metadata = { title: 'Pricing — Omnia' };

const PLANS = [
  {
    tier: 'free',
    name: 'Free',
    desc: 'Try Omnia with no commitment',
    price: { m: 0, y: 0 },
    color: 'hsl(240 5% 55%)',
    features: [
      '30 AI messages / month',
      '20 notes',
      '10 file uploads',
      '5 exports',
      'Basic planner (50 tasks)',
      '10 reminders',
      'AI assistant (general mode)',
    ],
    missing: [
      'Life Hub (finance & fitness)',
      'AI Money Tools',
      'Invoices & proposals',
      'Content Studio',
    ],
  },
  {
    tier: 'plus',
    name: 'Plus',
    desc: 'Everything you need to grow',
    price: { m: 12, y: 99 },
    color: 'hsl(205,90%,60%)',
    highlight: true,
    features: [
      '500 AI messages / month',
      'Unlimited notes & tasks',
      '50 file uploads',
      '50 exports / month',
      'Life Hub — all 22 tools',
      'AI Money Tools — all 4 tools',
      'All 6 AI modes',
      'Full planner + goals + habits',
      '25 invoices / month',
      'Proposals & Doc Builder',
      '100 reminders',
      'Content Studio (200 pieces)',
    ],
    missing: [],
  },
  {
    tier: 'pro',
    name: 'Pro',
    desc: 'Unlimited power for professionals',
    price: { m: 29, y: 249 },
    color: 'hsl(262,83%,75%)',
    features: [
      'Unlimited AI messages',
      'Unlimited everything',
      '250 file uploads',
      '500 exports / month',
      'Unlimited invoices',
      'Life Hub + AI Money Tools',
      'Priority support',
      'Advanced AI memory',
      'API access (coming soon)',
      'Team features (coming soon)',
    ],
    missing: [],
  },
];

const FAQ = [
  { q: 'Can I cancel anytime?', a: 'Yes — cancel anytime from your billing dashboard. No lock-in, no hassle.' },
  { q: 'What counts as an AI message?', a: 'Each time you send a message and receive a response counts as one AI message. Image generation and web searches also use one credit each.' },
  { q: 'Does the free plan expire?', a: 'No — the free plan is free forever. You\'ll just have lower usage limits than paid plans.' },
  { q: 'What\'s in Life Hub?', a: '22 AI-powered tools split across Finance (budget planner, debt payoff, investment ideas, tax estimator, financial health score, and more) and Fitness (workout planner, meal planner, calorie tracker, AI personal trainer, and more).' },
  { q: 'Is there a 7-day trial?', a: 'Yes — all paid plans include a 7-day free trial. No card charged until the trial ends.' },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'hsl(240 10% 4%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: 'hsl(0 0% 90%)' }}>
      <nav style={{ borderBottom: '1px solid hsl(240 6% 14%)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'hsl(240 10% 4% / 0.95)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="hsl(205, 90%, 48%)" />
          </div>
          <span style={{ fontWeight: 700, color: 'hsl(0 0% 90%)', fontSize: '16px' }}>Omnia</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/login" style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/signup" style={{ padding: '8px 16px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1020px', margin: '0 auto', padding: '60px 20px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.2)', marginBottom: '20px' }}>
            <Zap size={11} color="hsl(205, 90%, 60%)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(205, 90%, 60%)' }}>7-day free trial on all paid plans</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '14px' }}>
            Simple, honest pricing
          </h1>
          <p style={{ fontSize: '17px', color: 'hsl(240 5% 55%)', maxWidth: '500px', margin: '0 auto' }}>
            Start free. Upgrade when you need Life Hub, unlimited AI, and the full toolkit.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '64px' }}>
          {PLANS.map(p => (
            <div
              key={p.tier}
              style={{
                background: p.highlight ? 'hsl(240 6% 8%)' : 'hsl(240 6% 7%)',
                border: `1px solid ${p.highlight ? 'hsl(205 90% 48% / 0.4)' : 'hsl(240 6% 14%)'}`,
                borderRadius: '16px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: p.highlight ? '0 0 40px hsl(205 90% 48% / 0.08)' : 'none',
              }}
            >
              {p.highlight && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: '999px', background: 'hsl(205, 90%, 48%)', color: 'white', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                  MOST POPULAR
                </div>
              )}

              {/* Plan name + icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {p.tier === 'free' && <Sparkles size={15} color={p.color} />}
                {p.tier === 'plus' && <Zap size={15} color={p.color} />}
                {p.tier === 'pro' && <Crown size={15} color={p.color} />}
                <span style={{ fontWeight: 700, fontSize: '16px', color: p.color }}>{p.name}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', margin: '0 0 20px' }}>{p.desc}</p>

              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  {p.price.m === 0 ? (
                    <span style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em' }}>Free</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '14px', color: 'hsl(240 5% 50%)', marginBottom: '2px', alignSelf: 'flex-start', paddingTop: '10px' }}>£</span>
                      <span style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-0.03em' }}>{p.price.m}</span>
                      <span style={{ fontSize: '13px', color: 'hsl(240 5% 50%)' }}>/month</span>
                    </>
                  )}
                </div>
                {p.price.y > 0 && (
                  <p style={{ fontSize: '12px', color: '#34d399', margin: '4px 0 0', fontWeight: 500 }}>
                    or £{p.price.y}/year — save £{(p.price.m * 12) - p.price.y}
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                href="/signup"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '12px', borderRadius: '10px', marginBottom: '24px',
                  background: p.highlight ? 'hsl(205, 90%, 48%)' : p.tier === 'pro' ? 'hsl(262 83% 58% / 0.15)' : 'transparent',
                  border: p.highlight ? 'none' : `1px solid ${p.tier === 'pro' ? 'hsl(262 83% 58% / 0.3)' : 'hsl(240 6% 20%)'}`,
                  color: p.highlight ? 'white' : p.tier === 'pro' ? 'hsl(262, 83%, 75%)' : 'hsl(0 0% 80%)',
                  textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                }}
              >
                {p.tier === 'free' ? 'Get Started Free' : 'Start 7-Day Trial'} <ArrowRight size={14} />
              </Link>

              {/* Divider */}
              <div style={{ height: '1px', background: 'hsl(240 6% 14%)', marginBottom: '20px' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', flex: 1 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: '9px', fontSize: '13px', alignItems: 'flex-start' }}>
                    <Check size={14} color="#34d399" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ color: 'hsl(240 5% 70%)' }}>{f}</span>
                  </li>
                ))}
                {p.missing.map(f => (
                  <li key={f} style={{ display: 'flex', gap: '9px', fontSize: '13px', alignItems: 'flex-start', opacity: 0.4 }}>
                    <X size={14} color="hsl(240 5% 50%)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ color: 'hsl(240 5% 50%)' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compare row — mobile stacks to 1 col */}
        <style>{`
          .pricing-cards { grid-template-columns: repeat(3,1fr) !important; }
          @media (max-width: 700px) {
            .pricing-cards { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 900px) {
            .pricing-cards { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* FAQ */}
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center', marginBottom: '28px', letterSpacing: '-0.02em' }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ padding: '18px 20px', borderRadius: '12px', background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 13%)' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 6px' }}>{item.q}</p>
                <p style={{ fontSize: '13px', color: 'hsl(240 5% 55%)', margin: 0, lineHeight: 1.6 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '56px' }}>
          <p style={{ fontSize: '13px', color: 'hsl(240 5% 40%)', marginBottom: '16px' }}>No credit card required · Cancel anytime · 7-day trial on paid plans</p>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', background: 'hsl(205 90% 48%)', color: 'white', borderRadius: '12px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px hsl(205 90% 48% / 0.25)' }}>
            Start for free <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid hsl(240 6% 12%)', padding: '20px', textAlign: 'center', fontSize: '13px', color: 'hsl(240 5% 38%)' }}>
        © {new Date().getFullYear()} Omnia ·{' '}
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> ·{' '}
        <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
      </footer>
    </div>
  );
}
