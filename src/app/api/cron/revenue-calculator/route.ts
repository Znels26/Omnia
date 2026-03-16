import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PLAN_PRICES: Record<string, number> = { free: 0, plus: 25, pro: 40 };

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  const { data: subs } = await s
    .from('subscriptions')
    .select('plan_tier, status')
    .eq('status', 'active');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: churned } = await s
    .from('subscriptions')
    .select('id')
    .eq('status', 'canceled')
    .gte('updated_at', thirtyDaysAgo);

  const { data: newSubs } = await s
    .from('subscriptions')
    .select('id, plan_tier')
    .neq('plan_tier', 'free')
    .gte('created_at', thirtyDaysAgo);

  const mrr = (subs ?? []).reduce((sum, s) => sum + (PLAN_PRICES[s.plan_tier] ?? 0), 0);
  const activeCount = (subs ?? []).filter(s => s.plan_tier !== 'free').length;
  const churnRate = activeCount > 0 ? ((churned?.length ?? 0) / activeCount * 100).toFixed(2) : '0';

  const metrics = {
    mrr_usd: mrr,
    active_paid: activeCount,
    churned_30d: churned?.length ?? 0,
    new_subs_30d: newSubs?.length ?? 0,
    churn_rate_pct: parseFloat(churnRate),
    plan_breakdown: {
      free: (subs ?? []).filter(s => s.plan_tier === 'free').length,
      plus: (subs ?? []).filter(s => s.plan_tier === 'plus').length,
      pro: (subs ?? []).filter(s => s.plan_tier === 'pro').length,
    },
  };

  await s.from('admin_metrics').insert({
    metric_key: 'revenue',
    metric_value: metrics,
  });

  return NextResponse.json(metrics);
}
