import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type AutopilotUser = {
  user_id: string;
  persona: string | null;
  industry: string | null;
  autopilot_enabled: boolean;
  profiles: {
    email: string | null;
    display_name: string | null;
    full_name: string | null;
  } | null;
};

async function searchTavily(query: string): Promise<{ title: string; url: string; content: string }[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 3,
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).slice(0, 3).map((r: any) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.content ?? '',
    }));
  } catch (err) {
    console.error('[cron/intelligence] Tavily error:', err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch autopilot-enabled users
  const { data: users, error: usersError } = await supabase
    .from('user_autopilot_profile')
    .select('user_id, persona, industry, autopilot_enabled, profiles(email, display_name, full_name)')
    .eq('autopilot_enabled', true)
    .limit(100);

  if (usersError) {
    console.error('[cron/intelligence] users fetch error:', usersError.message);
    await supabase.from('cron_logs').insert({
      job_name: 'intelligence',
      status: 'error',
      details: { error: usersError.message },
    });
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  if (!users?.length) {
    await supabase.from('cron_logs').insert({
      job_name: 'intelligence',
      status: 'success',
      details: { users_processed: 0 },
    });
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;

  for (const user of users as AutopilotUser[]) {
    try {
      const userId = user.user_id;

      // Check overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_name, total_cents, due_date, currency')
        .eq('user_id', userId)
        .eq('status', 'sent')
        .lt('due_date', today);

      // Check upcoming goal deadlines
      const { data: upcomingGoals } = await supabase
        .from('goals')
        .select('id, title, target_date, status')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .gte('target_date', today)
        .lte('target_date', sevenDaysFromNow);

      // Check financial position from life_hub if available
      const { data: lifeHubData } = await supabase
        .from('life_hub')
        .select('category, data, updated_at')
        .eq('user_id', userId)
        .eq('category', 'finance')
        .single();

      const findings: string[] = [];
      const urgentItems: { type: string; description: string; metadata: Record<string, unknown> }[] = [];

      // Build findings from overdue invoices
      if (overdueInvoices && overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.total_cents ?? 0), 0);
        const formattedTotal = (totalOverdue / 100).toFixed(2);
        findings.push(`${overdueInvoices.length} overdue invoice(s) totalling ${formattedTotal}`);
        urgentItems.push({
          type: 'overdue_invoices',
          description: `${overdueInvoices.length} overdue invoice(s) totalling ${formattedTotal}`,
          metadata: { invoices: overdueInvoices.map((i: any) => ({ id: i.id, number: i.invoice_number, client: i.client_name, due: i.due_date })) },
        });
      }

      // Build findings from upcoming goals
      if (upcomingGoals && upcomingGoals.length > 0) {
        findings.push(`${upcomingGoals.length} goal(s) with deadlines in the next 7 days`);
        urgentItems.push({
          type: 'goal_deadline',
          description: `${upcomingGoals.length} goal deadline(s) approaching`,
          metadata: { goals: upcomingGoals.map((g: any) => ({ id: g.id, title: g.title, target_date: g.target_date })) },
        });
      }

      // Add financial position if available
      if (lifeHubData?.data) {
        findings.push('Financial data reviewed from Life Hub');
      }

      // Insert autopilot_log entry
      if (findings.length > 0) {
        const { error: logError } = await supabase.from('autopilot_log').insert({
          user_id: userId,
          event_type: 'intelligence_check',
          findings,
          created_at: now,
        });
        if (logError) {
          console.error(`[cron/intelligence] autopilot_log insert error for ${userId}:`, logError.message);
        }
      }

      // Insert urgent alert actions
      for (const item of urgentItems) {
        const { error: actionError } = await supabase.from('autopilot_actions').insert({
          user_id: userId,
          action_type: 'urgent_alert',
          title: item.description,
          metadata: item.metadata,
          status: 'pending',
          created_at: now,
        });
        if (actionError) {
          console.error(`[cron/intelligence] autopilot_actions insert error for ${userId}:`, actionError.message);
        }
      }

      // Search for opportunities via Tavily
      const persona = user.persona ?? 'freelancer';
      const industry = user.industry ?? 'business';
      const opportunities = await searchTavily(`opportunities for ${persona} in ${industry}`);

      for (const opp of opportunities) {
        const { error: oppError } = await supabase.from('opportunity_queue').insert({
          user_id: userId,
          title: opp.title,
          url: opp.url,
          description: opp.content.slice(0, 500),
          source: 'tavily',
          status: 'new',
          created_at: now,
        });
        if (oppError) {
          console.error(`[cron/intelligence] opportunity_queue insert error for ${userId}:`, oppError.message);
        }
      }

      processed++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron/intelligence] error processing user ${user.user_id}:`, message);
    }
  }

  // Log to cron_logs
  await supabase.from('cron_logs').insert({
    job_name: 'intelligence',
    status: 'success',
    details: { users_processed: processed },
  });

  return NextResponse.json({ ok: true, processed });
}
