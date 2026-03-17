import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type AutopilotUser = {
  user_id: string;
  persona: string | null;
  industry: string | null;
  autopilot_enabled: boolean;
  starter_observed_until: string | null;
  profiles: {
    email: string | null;
    display_name: string | null;
    full_name: string | null;
    created_at: string | null;
  } | null;
};

async function callHaiku(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Haiku API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.content?.[0]?.text ?? '';
}

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
    console.error('[cron/persona] Tavily error:', err);
    return [];
  }
}

// ── Persona handlers ────────────────────────────────────────────────────────

async function handleHustler(supabase: ReturnType<typeof createAdminSupabaseClient>, user: AutopilotUser, now: string): Promise<void> {
  const industry = user.industry ?? 'business';
  const query = `freelance gigs remote work opportunities ${industry}`;
  const results = await searchTavily(query);

  for (const result of results) {
    const { error } = await supabase.from('opportunity_queue').insert({
      user_id: user.user_id,
      title: result.title,
      url: result.url,
      description: result.content.slice(0, 500),
      source: 'tavily_hustler',
      status: 'new',
      created_at: now,
    });
    if (error) {
      console.error(`[cron/persona] hustler opportunity_queue insert error for ${user.user_id}:`, error.message);
    }
  }
}

async function handleCreator(supabase: ReturnType<typeof createAdminSupabaseClient>, user: AutopilotUser, now: string): Promise<void> {
  const persona = user.persona ?? 'creator';
  const industry = user.industry ?? 'content';

  const prompt = `Generate 5 unique, platform-agnostic content ideas for a ${persona} in the ${industry} niche. Make them specific and actionable. Return ONLY a JSON array of 5 strings, no other text.`;

  try {
    const text = await callHaiku(prompt);
    const match = text.match(/\[[\s\S]*?\]/);
    const ideas: string[] = match ? (JSON.parse(match[0]) as string[]).slice(0, 5) : [];

    for (const idea of ideas) {
      const { error } = await supabase.from('autopilot_actions').insert({
        user_id: user.user_id,
        action_type: 'content_idea',
        title: String(idea).slice(0, 500),
        metadata: { persona, industry, source: 'persona_cron', generated_at: now },
        status: 'pending',
        created_at: now,
      });
      if (error) {
        console.error(`[cron/persona] creator content_idea insert error for ${user.user_id}:`, error.message);
      }
    }
  } catch (err) {
    console.error(`[cron/persona] handleCreator error for ${user.user_id}:`, err);
  }
}

async function handleOperator(supabase: ReturnType<typeof createAdminSupabaseClient>, user: AutopilotUser, now: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_name, client_email, total_cents, due_date, currency')
    .eq('user_id', user.user_id)
    .eq('status', 'sent')
    .lt('due_date', today);

  if (!overdueInvoices?.length) return;

  for (const invoice of overdueInvoices) {
    const amountFormatted = invoice.total_cents
      ? `${((invoice.total_cents as number) / 100).toFixed(2)} ${invoice.currency ?? 'GBP'}`
      : 'unknown amount';

    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.due_date as string).getTime()) / (1000 * 60 * 60 * 24)
    );

    const { error } = await supabase.from('autopilot_actions').insert({
      user_id: user.user_id,
      action_type: 'invoice_chase',
      title: `Chase invoice ${invoice.invoice_number ?? invoice.id} — ${amountFormatted} (${daysOverdue}d overdue)`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        amount: amountFormatted,
        days_overdue: daysOverdue,
        due_date: invoice.due_date,
        generated_at: now,
      },
      status: 'pending',
      created_at: now,
    });
    if (error) {
      console.error(`[cron/persona] operator invoice_chase insert error for ${user.user_id}:`, error.message);
    }
  }
}

async function handleBuilder(supabase: ReturnType<typeof createAdminSupabaseClient>, user: AutopilotUser, now: string): Promise<void> {
  // Find savings-related goals
  const { data: savingsGoals } = await supabase
    .from('goals')
    .select('id, title, progress, target_amount, current_amount, target_date')
    .eq('user_id', user.user_id)
    .neq('status', 'completed')
    .ilike('title', '%sav%')
    .limit(5);

  const allSavingsGoals = savingsGoals ?? [];

  if (allSavingsGoals.length === 0) {
    // No savings goals — offer a generic financial tip
    const { error } = await supabase.from('autopilot_actions').insert({
      user_id: user.user_id,
      action_type: 'financial_tip',
      title: 'Consider setting a savings goal to build your financial foundation',
      metadata: { source: 'persona_cron_builder', generated_at: now },
      status: 'pending',
      created_at: now,
    });
    if (error) {
      console.error(`[cron/persona] builder financial_tip insert error for ${user.user_id}:`, error.message);
    }
    return;
  }

  for (const goal of allSavingsGoals) {
    const progress = typeof goal.progress === 'number' ? goal.progress : 0;
    const daysLeft = goal.target_date
      ? Math.max(0, Math.floor((new Date(goal.target_date as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    let tip = `Your savings goal "${goal.title}" is ${progress}% complete.`;
    if (daysLeft !== null && daysLeft <= 30 && progress < 80) {
      tip += ` Only ${daysLeft} days left — consider increasing contributions to hit your target.`;
    } else if (progress >= 80) {
      tip += ' You are almost there — keep going!';
    } else {
      tip += ' Stay consistent with your contributions.';
    }

    const { error } = await supabase.from('autopilot_actions').insert({
      user_id: user.user_id,
      action_type: 'financial_tip',
      title: tip.slice(0, 500),
      metadata: {
        goal_id: goal.id,
        goal_title: goal.title,
        progress,
        days_left: daysLeft,
        generated_at: now,
      },
      status: 'pending',
      created_at: now,
    });
    if (error) {
      console.error(`[cron/persona] builder financial_tip insert error for ${user.user_id}:`, error.message);
    }
  }
}

async function handleOptimiser(supabase: ReturnType<typeof createAdminSupabaseClient>, user: AutopilotUser, now: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Check habit streaks (tasks completed consistently)
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, title, updated_at, status')
    .eq('user_id', user.user_id)
    .eq('status', 'completed')
    .gte('updated_at', `${sevenDaysAgo}T00:00:00.000Z`)
    .order('updated_at', { ascending: false })
    .limit(50);

  const completedCount = (recentTasks ?? []).length;

  let motivationMessage: string;
  if (completedCount >= 20) {
    motivationMessage = `Outstanding! You completed ${completedCount} tasks in the last 7 days. Your consistency is building serious momentum.`;
  } else if (completedCount >= 10) {
    motivationMessage = `Great work! ${completedCount} tasks completed this week. You're in a solid rhythm — keep it up.`;
  } else if (completedCount >= 5) {
    motivationMessage = `You completed ${completedCount} tasks this week. Good progress — try to hit 10 next week for even bigger results.`;
  } else if (completedCount > 0) {
    motivationMessage = `${completedCount} tasks done this week. Every step counts — what can you complete today to build momentum?`;
  } else {
    motivationMessage = `No tasks completed this week yet. Start small — even completing one task today will build your streak.`;
  }

  const { error } = await supabase.from('autopilot_actions').insert({
    user_id: user.user_id,
    action_type: 'motivation',
    title: motivationMessage.slice(0, 500),
    metadata: {
      tasks_completed_last_7_days: completedCount,
      week_start: sevenDaysAgo,
      week_end: today,
      generated_at: now,
    },
    status: 'pending',
    created_at: now,
  });
  if (error) {
    console.error(`[cron/persona] optimiser motivation insert error for ${user.user_id}:`, error.message);
  }
}

async function handleStarter(supabase: ReturnType<typeof createAdminSupabaseClient>, user: AutopilotUser, now: string): Promise<void> {
  // Only act if starter_observed_until has passed (7 days of observation)
  if (!user.starter_observed_until) return;

  const observedUntil = new Date(user.starter_observed_until);
  const accountCreated = user.profiles?.created_at ? new Date(user.profiles.created_at) : null;

  const sevenDaysMet =
    accountCreated && Date.now() - accountCreated.getTime() >= 7 * 24 * 60 * 60 * 1000;

  if (Date.now() < observedUntil.getTime() || !sevenDaysMet) return;

  // Gather usage signals for persona recommendation
  const [tasksResult, goalsResult, invoicesResult, contentResult] = await Promise.allSettled([
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id),
    supabase.from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id),
    supabase.from('content_items').select('id', { count: 'exact', head: true }).eq('user_id', user.user_id),
  ]);

  const taskCount = tasksResult.status === 'fulfilled' ? (tasksResult.value.count ?? 0) : 0;
  const goalCount = goalsResult.status === 'fulfilled' ? (goalsResult.value.count ?? 0) : 0;
  const invoiceCount = invoicesResult.status === 'fulfilled' ? (invoicesResult.value.count ?? 0) : 0;
  const contentCount = contentResult.status === 'fulfilled' ? (contentResult.value.count ?? 0) : 0;

  const prompt = `Based on this new user's 7-day activity, recommend the best persona for them:
- Tasks created: ${taskCount}
- Goals set: ${goalCount}
- Invoices created: ${invoiceCount}
- Content items: ${contentCount}

Available personas: hustler (freelance/gigs), creator (content), operator (business ops), builder (finance/savings), optimiser (habits/systems), starter (still exploring).

Return ONLY a JSON object: { "recommendedPersona": "persona_name", "reasoning": "one sentence reason" }`;

  try {
    const text = await callHaiku(prompt);
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return;

    const result = JSON.parse(match[0]) as { recommendedPersona: string; reasoning: string };
    const validPersonas = ['hustler', 'creator', 'operator', 'builder', 'optimiser', 'starter'];
    const recommended = validPersonas.includes(result.recommendedPersona) ? result.recommendedPersona : 'optimiser';

    const { error: actionError } = await supabase.from('autopilot_actions').insert({
      user_id: user.user_id,
      action_type: 'persona_recommendation',
      title: `Based on your first week, we recommend the "${recommended}" persona for you`,
      metadata: {
        recommended_persona: recommended,
        reasoning: result.reasoning,
        usage_signals: { taskCount, goalCount, invoiceCount, contentCount },
        generated_at: now,
      },
      status: 'pending',
      created_at: now,
    });
    if (actionError) {
      console.error(`[cron/persona] starter persona_recommendation insert error for ${user.user_id}:`, actionError.message);
    }
  } catch (err) {
    console.error(`[cron/persona] handleStarter error for ${user.user_id}:`, err);
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();

  // Fetch autopilot-enabled users with starter_observed_until
  const { data: users, error: usersError } = await supabase
    .from('user_autopilot_profile')
    .select('user_id, persona, industry, autopilot_enabled, starter_observed_until, profiles(email, display_name, full_name, created_at)')
    .eq('autopilot_enabled', true)
    .limit(100);

  if (usersError) {
    console.error('[cron/persona] users fetch error:', usersError.message);
    await supabase.from('cron_logs').insert({
      job_name: 'persona',
      status: 'error',
      details: { error: usersError.message },
    });
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  if (!users?.length) {
    await supabase.from('cron_logs').insert({
      job_name: 'persona',
      status: 'success',
      details: { users_processed: 0 },
    });
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const personaCounts: Record<string, number> = {};
  let processed = 0;

  for (const user of users as AutopilotUser[]) {
    try {
      const persona = (user.persona ?? 'starter').toLowerCase();
      personaCounts[persona] = (personaCounts[persona] ?? 0) + 1;

      switch (persona) {
        case 'hustler':
          await handleHustler(supabase, user, now);
          break;
        case 'creator':
          await handleCreator(supabase, user, now);
          break;
        case 'operator':
          await handleOperator(supabase, user, now);
          break;
        case 'builder':
          await handleBuilder(supabase, user, now);
          break;
        case 'optimiser':
          await handleOptimiser(supabase, user, now);
          break;
        case 'starter':
          await handleStarter(supabase, user, now);
          break;
        default:
          console.warn(`[cron/persona] unknown persona "${persona}" for user ${user.user_id}`);
      }

      // Log to autopilot_log
      const { error: logError } = await supabase.from('autopilot_log').insert({
        user_id: user.user_id,
        event_type: 'persona_daily_action',
        findings: [`Ran persona-specific action for "${persona}"`],
        created_at: now,
      });
      if (logError) {
        console.error(`[cron/persona] autopilot_log insert error for ${user.user_id}:`, logError.message);
      }

      processed++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron/persona] error processing user ${user.user_id}:`, message);
    }
  }

  // Log to cron_logs
  await supabase.from('cron_logs').insert({
    job_name: 'persona',
    status: 'success',
    details: { users_processed: processed, persona_counts: personaCounts },
  });

  return NextResponse.json({ ok: true, processed, persona_counts: personaCounts });
}
