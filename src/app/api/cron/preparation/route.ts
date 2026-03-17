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

async function generateContentIdeas(persona: string, industry: string): Promise<string[]> {
  const prompt = `Generate exactly 3 content ideas for a ${persona} in the ${industry} industry. Return ONLY a JSON array of 3 short strings (each under 100 chars), no other text. Example: ["Idea 1","Idea 2","Idea 3"]`;

  try {
    const text = await callHaiku(prompt);
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.slice(0, 3).map(String) : [];
  } catch (err) {
    console.error('[cron/preparation] generateContentIdeas error:', err);
    return [
      `Share a ${industry} tip from this week`,
      `Write about a challenge you solved as a ${persona}`,
      `Post a behind-the-scenes look at your ${industry} workflow`,
    ];
  }
}

async function generateDailyBriefing(
  name: string,
  persona: string,
  industry: string,
  taskCount: number,
  goalCount: number
): Promise<string> {
  const prompt = `Write a personalised daily briefing in 2-3 sentences for ${name}, a ${persona} in ${industry}. They have ${taskCount} pending tasks and ${goalCount} active goals today. Be motivating, specific, and concise.`;

  try {
    const text = await callHaiku(prompt);
    return text.trim().slice(0, 500);
  } catch (err) {
    console.error('[cron/preparation] generateDailyBriefing error:', err);
    return `Good morning, ${name}! You have ${taskCount} tasks and ${goalCount} goals to work on today. Make it count.`;
  }
}

async function identifyTopPriorityTasks(tasks: { id: string; title: string; due_date: string | null }[]): Promise<string[]> {
  if (tasks.length === 0) return [];

  const taskList = tasks
    .slice(0, 20)
    .map((t, i) => `${i + 1}. ${t.title}${t.due_date ? ` (due: ${t.due_date})` : ''}`)
    .join('\n');

  const prompt = `Given these pending tasks, identify the top 3 priorities for today. Return ONLY a JSON array of up to 3 task titles (exact strings from the list), no other text.\n\nTasks:\n${taskList}`;

  try {
    const text = await callHaiku(prompt);
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return tasks.slice(0, 3).map((t) => t.title);
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.slice(0, 3).map(String) : tasks.slice(0, 3).map((t) => t.title);
  } catch (err) {
    console.error('[cron/preparation] identifyTopPriorityTasks error:', err);
    return tasks.slice(0, 3).map((t) => t.title);
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  // Fetch autopilot-enabled users
  const { data: users, error: usersError } = await supabase
    .from('user_autopilot_profile')
    .select('user_id, persona, industry, autopilot_enabled, profiles(email, display_name, full_name)')
    .eq('autopilot_enabled', true)
    .limit(100);

  if (usersError) {
    console.error('[cron/preparation] users fetch error:', usersError.message);
    await supabase.from('cron_logs').insert({
      job_name: 'preparation',
      status: 'error',
      details: { error: usersError.message },
    });
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  if (!users?.length) {
    await supabase.from('cron_logs').insert({
      job_name: 'preparation',
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

      // Fetch pending tasks for today
      const { data: pendingTasks } = await supabase
        .from('tasks')
        .select('id, title, due_date')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .or(`due_date.is.null,due_date.lte.${today}`)
        .order('due_date', { ascending: true })
        .limit(20);

      // Fetch active goals
      const { data: activeGoals } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .limit(10);

      const taskList = pendingTasks ?? [];
      const goalList = activeGoals ?? [];

      // 1. Generate 3 content ideas
      const contentIdeas = await generateContentIdeas(persona, industry);

      for (const idea of contentIdeas) {
        const { error: ideaError } = await supabase.from('autopilot_actions').insert({
          user_id: userId,
          action_type: 'content_idea',
          title: idea,
          metadata: { persona, industry, generated_at: now },
          status: 'pending',
          created_at: now,
        });
        if (ideaError) {
          console.error(`[cron/preparation] content_idea insert error for ${userId}:`, ideaError.message);
        }
      }

      // 2. Generate personalised daily briefing
      const briefing = await generateDailyBriefing(
        name,
        persona,
        industry,
        taskList.length,
        goalList.length
      );

      const { error: briefingError } = await supabase.from('autopilot_actions').insert({
        user_id: userId,
        action_type: 'briefing',
        title: `Daily briefing for ${today}`,
        metadata: {
          briefing_text: briefing,
          task_count: taskList.length,
          goal_count: goalList.length,
          generated_at: now,
        },
        status: 'pending',
        created_at: now,
      });
      if (briefingError) {
        console.error(`[cron/preparation] briefing insert error for ${userId}:`, briefingError.message);
      }

      // 3. Identify top 3 priority tasks
      if (taskList.length > 0) {
        const priorities = await identifyTopPriorityTasks(taskList);

        if (priorities.length > 0) {
          const { error: priorityError } = await supabase.from('autopilot_actions').insert({
            user_id: userId,
            action_type: 'priority_tasks',
            title: `Top priorities for ${today}`,
            metadata: {
              priorities,
              generated_at: now,
            },
            status: 'pending',
            created_at: now,
          });
          if (priorityError) {
            console.error(`[cron/preparation] priority_tasks insert error for ${userId}:`, priorityError.message);
          }
        }
      }

      // Log to autopilot_log
      const { error: logError } = await supabase.from('autopilot_log').insert({
        user_id: userId,
        event_type: 'morning_preparation',
        findings: [
          `Generated ${contentIdeas.length} content ideas`,
          'Generated daily briefing',
          `Identified ${Math.min(taskList.length, 3)} priority tasks`,
        ],
        created_at: now,
      });
      if (logError) {
        console.error(`[cron/preparation] autopilot_log insert error for ${userId}:`, logError.message);
      }

      processed++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron/preparation] error processing user ${user.user_id}:`, message);
    }
  }

  // Log to cron_logs
  await supabase.from('cron_logs').insert({
    job_name: 'preparation',
    status: 'success',
    details: { users_processed: processed },
  });

  return NextResponse.json({ ok: true, processed });
}
