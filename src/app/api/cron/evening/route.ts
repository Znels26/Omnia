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
      max_tokens: 600,
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

async function generateTomorrowPriorities(
  name: string,
  persona: string,
  industry: string,
  completedToday: number,
  pendingTasks: { title: string; due_date: string | null }[],
  goalProgress: { title: string; progress: number }[]
): Promise<string[]> {
  const taskSummary =
    pendingTasks.length > 0
      ? pendingTasks
          .slice(0, 10)
          .map((t) => `- ${t.title}${t.due_date ? ` (due: ${t.due_date})` : ''}`)
          .join('\n')
      : 'No pending tasks';

  const goalSummary =
    goalProgress.length > 0
      ? goalProgress
          .slice(0, 5)
          .map((g) => `- ${g.title} (${g.progress}% complete)`)
          .join('\n')
      : 'No active goals';

  const prompt = `${name} is a ${persona} in ${industry}. Today they completed ${completedToday} tasks.

Pending tasks:
${taskSummary}

Active goals:
${goalSummary}

Based on this, identify the top 3 priorities for tomorrow. Return ONLY a JSON array of 3 short action strings, no other text. Example: ["Priority 1","Priority 2","Priority 3"]`;

  try {
    const text = await callHaiku(prompt);
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return pendingTasks.slice(0, 3).map((t) => t.title);
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.slice(0, 3).map(String) : pendingTasks.slice(0, 3).map((t) => t.title);
  } catch (err) {
    console.error('[cron/evening] generateTomorrowPriorities error:', err);
    return pendingTasks.slice(0, 3).map((t) => t.title);
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const todayStart = `${today}T00:00:00.000Z`;

  // Fetch autopilot-enabled users
  const { data: users, error: usersError } = await supabase
    .from('user_autopilot_profile')
    .select('user_id, persona, industry, autopilot_enabled, profiles(email, display_name, full_name)')
    .eq('autopilot_enabled', true)
    .limit(100);

  if (usersError) {
    console.error('[cron/evening] users fetch error:', usersError.message);
    await supabase.from('cron_logs').insert({
      job_name: 'evening',
      status: 'error',
      details: { error: usersError.message },
    });
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  if (!users?.length) {
    await supabase.from('cron_logs').insert({
      job_name: 'evening',
      status: 'success',
      details: { users_processed: 0 },
    });
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;

  for (const user of users as AutopilotUser[]) {
    try {
      const userId = user.user_id;
      const persona = user.persona ?? 'freelancer';
      const industry = user.industry ?? 'business';
      const name =
        user.profiles?.display_name ||
        user.profiles?.full_name ||
        'there';

      // Count tasks completed today
      const { count: completedCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('updated_at', todayStart);

      const completedToday = completedCount ?? 0;

      // Fetch pending tasks for tomorrow's planning
      const { data: pendingTasks } = await supabase
        .from('tasks')
        .select('id, title, due_date')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(20);

      // Calculate goal progress
      const { data: activeGoals } = await supabase
        .from('goals')
        .select('id, title, progress, target_date, status')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .limit(10);

      const goalProgress = (activeGoals ?? []).map((g: any) => ({
        title: g.title,
        progress: typeof g.progress === 'number' ? g.progress : 0,
      }));

      // Generate tomorrow's priority list
      const tomorrowPriorities = await generateTomorrowPriorities(
        name,
        persona,
        industry,
        completedToday,
        pendingTasks ?? [],
        goalProgress
      );

      // Insert evening_wrap action
      const { error: wrapError } = await supabase.from('autopilot_actions').insert({
        user_id: userId,
        action_type: 'evening_wrap',
        title: `Evening wrap for ${today}`,
        metadata: {
          tasks_completed_today: completedToday,
          pending_tasks_count: (pendingTasks ?? []).length,
          active_goals_count: (activeGoals ?? []).length,
          goal_progress: goalProgress,
          tomorrow_priorities: tomorrowPriorities,
          generated_at: now,
        },
        status: 'pending',
        created_at: now,
      });
      if (wrapError) {
        console.error(`[cron/evening] evening_wrap insert error for ${userId}:`, wrapError.message);
      }

      // Log to autopilot_log
      const { error: logError } = await supabase.from('autopilot_log').insert({
        user_id: userId,
        event_type: 'evening_review',
        findings: [
          `Completed ${completedToday} tasks today`,
          `${(pendingTasks ?? []).length} tasks still pending`,
          `${goalProgress.length} active goals tracked`,
          `Identified ${tomorrowPriorities.length} priorities for tomorrow`,
        ],
        created_at: now,
      });
      if (logError) {
        console.error(`[cron/evening] autopilot_log insert error for ${userId}:`, logError.message);
      }

      processed++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron/evening] error processing user ${user.user_id}:`, message);
    }
  }

  // Log to cron_logs
  await supabase.from('cron_logs').insert({
    job_name: 'evening',
    status: 'success',
    details: { users_processed: processed },
  });

  return NextResponse.json({ ok: true, processed });
}
