import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Approx cost: haiku ~$0.00025/1k tokens, sonnet ~$0.003/1k tokens
const COST_PER_1K_TOKENS = 0.001; // blended average
const ALERT_THRESHOLD_USD = 50; // alert if any user costs > $50/month

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  const { data: rows } = await s
    .from('usage_counters')
    .select('user_id, ai_tokens_used, ai_requests_used, profiles(email, display_name)')
    .gt('ai_tokens_used', 0)
    .order('ai_tokens_used', { ascending: false })
    .limit(100);

  if (!rows?.length) return NextResponse.json({ total_cost_usd: 0, alerts: 0 });

  const totalTokens = rows.reduce((sum: number, r: any) => sum + (r.ai_tokens_used ?? 0), 0);
  const totalCostUsd = (totalTokens / 1000) * COST_PER_1K_TOKENS;

  // Flag high-cost users
  const highCostUsers = rows.filter((r: any) => {
    const cost = (r.ai_tokens_used / 1000) * COST_PER_1K_TOKENS;
    return cost > ALERT_THRESHOLD_USD;
  });

  if (highCostUsers.length > 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'zacharynelson96@gmail.com';
    const body = highCostUsers
      .map((u: any) => {
        const cost = ((u.ai_tokens_used / 1000) * COST_PER_1K_TOKENS).toFixed(2);
        return `${u.profiles?.email ?? u.user_id}: $${cost} (${u.ai_tokens_used.toLocaleString()} tokens)`;
      })
      .join('\n');

    await sendEmail({
      to: adminEmail,
      subject: `⚠️ Omnia: ${highCostUsers.length} high-cost AI user(s) detected`,
      html: templates.adminAlert('High AI Cost Users', `The following users are exceeding $${ALERT_THRESHOLD_USD}/mo in AI costs:\n\n${body}\n\nTotal platform cost: $${totalCostUsd.toFixed(2)}`),
    });
  }

  await s.from('admin_metrics').insert({
    metric_key: 'ai_cost',
    metric_value: { total_cost_usd: totalCostUsd, total_tokens: totalTokens, high_cost_users: highCostUsers.length },
  });

  return NextResponse.json({ total_cost_usd: totalCostUsd.toFixed(2), total_tokens: totalTokens, alerts: highCostUsers.length });
}
