'use client';
import { useState } from 'react';
import { CreditCard, Check, Zap, Crown, ExternalLink, Sparkles, Heart, X } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const PLANS = [
  {
    tier: 'free', name: 'Free', icon: Sparkles, color: 'hsl(240 5% 55%)',
    price: { monthly: 0, yearly: 0 },
    features: ['30 AI messages/month', '20 notes', '10 file uploads', '5 exports', 'Basic planner (50 tasks)', '10 reminders', 'Autopilot onboarding & persona setup', 'Memory Import (up to 100 conversations)'],
    missing: ['Life Hub (22 tools)', 'AI Money Tools', 'Invoices & proposals', 'Autonomous Autopilot actions'],
  },
  {
    tier: 'plus', name: 'Plus', icon: Zap, color: 'hsl(205,90%,60%)', highlight: true,
    price: { monthly: 25, yearly: 199 },
    features: ['500 AI messages/month', 'Unlimited notes & tasks', '50 uploads', '50 exports/month', 'Life Hub — all 22 tools', 'AI Money Tools — all 4 tools', '25 invoices/month', 'Proposals & Doc Builder', '100 reminders', 'All 6 AI modes', 'Autopilot Level 1 (Draft Only)', 'Morning briefing + opportunity finder', 'Memory Import (500 conversations)', 'All 7 Autopilot personas'],
    missing: [],
  },
  {
    tier: 'pro', name: 'Pro', icon: Crown, color: 'hsl(262,83%,75%)',
    price: { monthly: 40, yearly: 329 },
    features: ['Unlimited AI messages', 'Unlimited everything', '250 uploads', '500 exports', 'Unlimited invoices', 'Life Hub + AI Money Tools', 'Priority support', 'Advanced AI memory', 'Full Autopilot (all 3 permission levels)', 'Fully autonomous operation', 'All persona-specific daily actions', 'Unlimited Memory Import', 'Priority Autopilot processing', 'Life coach mode + mental load reducer'],
    missing: [],
  },
];

export function BillingView({ profile, subscription }: any) {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const plan = profile?.plan_tier || 'free';

  const upgrade = async (tier: string) => {
    setLoading(tier);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval: billingInterval }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else toast.error(d.error || 'Stripe not configured yet');
    } finally {
      setLoading(null);
    }
  };

  const portal = async () => {
    setLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else toast.error(d.error || 'Not available');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '80px', maxWidth: '860px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>Billing & Plans</h1>
        <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', margin: 0 }}>Manage your subscription and usage</p>
      </div>

      {/* Current plan card */}
      <div className="card" style={{ padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CreditCard size={15} color="hsl(205, 90%, 60%)" />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Current Plan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className={`badge badge-${plan}`} style={{ textTransform: 'capitalize', fontSize: '13px', padding: '4px 12px' }}>{plan}</span>
              {subscription?.status && (
                <span style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '999px', background: subscription.status === 'active' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: subscription.status === 'active' ? '#34d399' : '#ef4444' }}>
                  {subscription.status}
                </span>
              )}
              {subscription?.current_period_end && (
                <span style={{ fontSize: '12px', color: 'hsl(240 5% 50%)' }}>
                  Renews {formatDate(subscription.current_period_end)}
                </span>
              )}
            </div>
          </div>
          {subscription?.stripe_customer_id && (
            <button onClick={portal} disabled={loading === 'portal'} className="btn btn-outline" style={{ fontSize: '13px', gap: '6px' }}>
              <ExternalLink size={13} />
              {loading === 'portal' ? 'Opening…' : 'Manage Billing'}
            </button>
          )}
        </div>
      </div>

      {/* Billing toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '13px', color: billingInterval === 'monthly' ? 'hsl(0 0% 88%)' : 'hsl(240 5% 50%)' }}>Monthly</span>
        <button
          onClick={() => setBillingInterval(i => i === 'monthly' ? 'yearly' : 'monthly')}
          style={{ width: '44px', height: '24px', borderRadius: '999px', background: billingInterval === 'yearly' ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 20%)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
        >
          <span style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', left: billingInterval === 'yearly' ? '23px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
        </button>
        <span style={{ fontSize: '13px', color: billingInterval === 'yearly' ? 'hsl(0 0% 88%)' : 'hsl(240 5% 50%)' }}>
          Yearly <span style={{ color: '#34d399', fontWeight: 600 }}>Save ~30%</span>
        </span>
      </div>

      {/* Autopilot highlight */}
      <div style={{ padding: '18px 20px', background: 'hsl(205 90% 48% / 0.06)', border: '1px solid hsl(205 90% 48% / 0.2)', borderRadius: '14px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Zap size={17} color="hsl(205,90%,60%)" />
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Omnia Autopilot</span>
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'hsl(205 90% 48% / 0.15)', color: 'hsl(205,90%,60%)', fontWeight: 700 }}>NEW</span>
        </div>
        <p style={{ fontSize: '12.5px', color: 'hsl(240 5% 55%)', margin: '0 0 12px', lineHeight: 1.6 }}>
          Your AI Chief of Staff — works overnight so you wake up to a done list. Upgrade to Plus or Pro to unlock autonomous actions, morning briefings, and personalised opportunity finding.
        </p>
        <Link href="/autopilot" style={{ fontSize: '12.5px', color: 'hsl(205,90%,60%)', fontWeight: 600, textDecoration: 'none' }}>Set up Autopilot →</Link>
      </div>

      {/* Plan cards */}
      <style>{`
        .billing-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        @media (max-width: 720px) { .billing-cards { grid-template-columns: 1fr; } }
      `}</style>
      <div className="billing-cards">
        {PLANS.map((p) => {
          const price = billingInterval === 'yearly' ? p.price.yearly : p.price.monthly;
          const isCurrent = plan === p.tier;
          const Icon = p.icon;

          return (
            <div
              key={p.tier}
              className="card"
              style={{
                padding: '22px 18px', display: 'flex', flexDirection: 'column', position: 'relative',
                borderColor: p.highlight ? 'hsl(205 90% 48% / 0.4)' : undefined,
                boxShadow: p.highlight ? '0 0 30px hsl(205 90% 48% / 0.08)' : undefined,
              }}
            >
              {p.highlight && (
                <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: '999px', background: 'hsl(205, 90%, 48%)', color: 'white', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                <Icon size={14} color={p.color} />
                <span style={{ fontWeight: 700, fontSize: '15px', color: p.color }}>{p.name}</span>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  {price === 0 ? (
                    <span style={{ fontSize: '28px', fontWeight: 800 }}>Free</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', paddingTop: '7px', alignSelf: 'flex-start' }}>$</span>
                      <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>{price}</span>
                      <span style={{ fontSize: '12px', color: 'hsl(240 5% 50%)' }}>/{billingInterval === 'yearly' ? 'yr' : 'mo'}</span>
                    </>
                  )}
                </div>
                {billingInterval === 'yearly' && price > 0 && (
                  <p style={{ fontSize: '11px', color: '#34d399', margin: '3px 0 0' }}>
                    Save ${(p.price.monthly * 12) - p.price.yearly} vs monthly
                  </p>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '12px' }}>
                    <Check size={13} color="#34d399" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ color: 'hsl(240 5% 68%)' }}>{f}</span>
                  </li>
                ))}
                {p.missing.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '12px', opacity: 0.35 }}>
                    <X size={13} color="hsl(240 5% 50%)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ color: 'hsl(240 5% 50%)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="btn" style={{ background: 'hsl(240 6% 16%)', color: 'hsl(240 5% 45%)', cursor: 'default', height: '38px', fontSize: '13px' }}>
                  Current Plan
                </button>
              ) : p.tier === 'free' ? (
                <button disabled className="btn btn-outline" style={{ height: '38px', opacity: 0.45, cursor: 'not-allowed', fontSize: '13px' }}>
                  Downgrade via portal
                </button>
              ) : (
                <button
                  onClick={() => upgrade(p.tier)}
                  disabled={!!loading}
                  className={`btn ${p.highlight ? 'btn-primary' : 'btn-outline'}`}
                  style={{ height: '38px', fontWeight: 600, fontSize: '13px', gap: '5px' }}
                >
                  {loading === p.tier ? 'Redirecting…' : `Upgrade to ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: '12px', color: 'hsl(240 5% 40%)', marginTop: '8px' }}>
        7-day free trial on paid plans · Cancel anytime · No hidden fees
      </p>
    </div>
  );
}
