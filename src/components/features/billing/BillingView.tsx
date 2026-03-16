'use client';
import { useState } from 'react';
import { CreditCard, Check, Zap, Crown, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const PLANS = [
  { tier: 'free', name: 'Free', price: { monthly: 0, yearly: 0 }, features: ['20 AI messages/month','10 notes','5 uploads','3 exports','Basic planner'] },
  { tier: 'plus', name: 'Plus', price: { monthly: 9, yearly: 79 }, features: ['150 AI messages/month','100 notes','25 uploads','25 exports','All AI modes','Document builder','Full planner','50 reminders'] },
  { tier: 'pro', name: 'Pro', price: { monthly: 19, yearly: 169 }, features: ['500 AI messages/month','Unlimited notes & tasks','100 uploads','100 exports','Invoice generation','Priority support'] },
];

export function BillingView({ profile, subscription }: any) {
  const [loading, setLoading] = useState<string|null>(null);
  const [interval, setInterval] = useState<'monthly'|'yearly'>('monthly');
  const plan = profile?.plan_tier || 'free';

  const upgrade = async (tier: string) => {
    setLoading(tier);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier, interval }) });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else toast.error(d.error || 'Stripe not configured yet');
    } finally { setLoading(null); }
  };

  const portal = async () => {
    setLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else toast.error(d.error || 'Not available');
    } finally { setLoading(null); }
  };

  return (
    <div className="page" style={{ paddingBottom: '80px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}><h1 style={{ fontSize: '24px', fontWeight: 700 }}>Billing & Plans</h1><p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', marginTop: '2px' }}>Manage your subscription</p></div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <CreditCard size={16} color="hsl(205, 90%, 60%)" />
              <h2 style={{ fontWeight: 600, fontSize: '15px' }}>Current Plan</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge badge-${plan}`} style={{ textTransform: 'capitalize', fontSize: '13px', padding: '4px 12px' }}>{plan}</span>
              {subscription?.status && <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '999px', background: subscription.status === 'active' ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)', color: subscription.status === 'active' ? '#34d399' : '#ef4444' }}>{subscription.status}</span>}
            </div>
            {subscription?.current_period_end && <p style={{ fontSize: '13px', color: 'hsl(240 5% 55%)', marginTop: '6px' }}>Renews {formatDate(subscription.current_period_end)}</p>}
          </div>
          {subscription?.stripe_customer_id && (
            <button onClick={portal} disabled={loading === 'portal'} className="btn btn-outline" style={{ gap: '6px' }}><ExternalLink size={14} />{loading === 'portal' ? 'Opening…' : 'Manage Billing'}</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '14px', color: interval === 'monthly' ? 'hsl(0 0% 88%)' : 'hsl(240 5% 55%)' }}>Monthly</span>
        <button onClick={() => setInterval(i => i === 'monthly' ? 'yearly' : 'monthly')} style={{ width: '44px', height: '24px', borderRadius: '999px', background: interval === 'yearly' ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 20%)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', left: interval === 'yearly' ? '23px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
        </button>
        <span style={{ fontSize: '14px', color: interval === 'yearly' ? 'hsl(0 0% 88%)' : 'hsl(240 5% 55%)' }}>Yearly <span style={{ color: '#34d399', fontWeight: 600 }}>Save ~30%</span></span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {PLANS.map((p, i) => {
          const price = interval === 'yearly' ? p.price.yearly : p.price.monthly;
          const isCurrent = plan === p.tier;
          const isPro = p.tier === 'pro';
          return (
            <div key={p.tier} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative', borderColor: isPro ? 'hsl(205 90% 48% / 0.4)' : undefined, boxShadow: isPro ? '0 0 30px hsl(205 90% 48% / 0.1)' : undefined }}>
              {isPro && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: '999px', background: 'hsl(205, 90%, 48%)', color: 'white', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>Most Popular</div>}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {p.tier === 'pro' ? <Crown size={16} color="#a78bfa" /> : <Zap size={16} color={p.tier === 'plus' ? 'hsl(205, 90%, 60%)' : '#888'} />}
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>{p.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '30px', fontWeight: 800 }}>{price === 0 ? 'Free' : `$${price}`}</span>
                  {price > 0 && <span style={{ fontSize: '13px', color: 'hsl(240 5% 55%)' }}>/{interval === 'yearly' ? 'yr' : 'mo'}</span>}
                </div>
                {interval === 'yearly' && price > 0 && <p style={{ fontSize: '11px', color: 'hsl(240 5% 50%)' }}>${p.price.monthly}/mo billed yearly</p>}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {p.features.map(f => <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}><Check size={14} color="#34d399" style={{ flexShrink: 0, marginTop: '1px' }} /><span style={{ color: 'hsl(240 5% 65%)' }}>{f}</span></li>)}
              </ul>
              {isCurrent ? (
                <button disabled className="btn" style={{ background: 'hsl(240 6% 16%)', color: 'hsl(240 5% 50%)', cursor: 'default', height: '40px' }}>Current Plan</button>
              ) : p.tier === 'free' ? (
                <button disabled className="btn btn-outline" style={{ height: '40px', opacity: 0.5, cursor: 'not-allowed' }}>Downgrade via portal</button>
              ) : (
                <button onClick={() => upgrade(p.tier)} disabled={!!loading} className={`btn ${isPro ? 'btn-primary' : 'btn-outline'}`} style={{ height: '40px', fontWeight: 600 }}>
                  {loading === p.tier ? 'Redirecting…' : `Upgrade to ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', fontSize: '13px', color: 'hsl(240 5% 45%)', marginTop: '16px' }}>7-day free trial on paid plans · Cancel anytime</p>
    </div>
  );
}
