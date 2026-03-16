import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function generateFitnessInsight(name: string, habits: any[], streaks: any): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return `You have ${habits.length} active habits. Current streak: ${streaks.login_streak ?? 0} days. Stay consistent!`;

  const habitSummary = habits.map((h: any) => `${h.title} (streak: ${h.streak_current})`).join(', ') || 'No habits set';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Write a personalised weekly fitness and habits progress review for ${name}:
Active habits: ${habitSummary}
Overall login streak: ${streaks?.login_streak ?? 0} days
Best streak ever: ${streaks?.login_streak_best ?? 0} days

Write 2-3 encouraging paragraphs with specific advice. Focus on consistency and progression.`,
      }],
    }),
  });

  if (!res.ok) return `Keep up with your ${habits.length} habits. Consistency is the key to progress!`;
  const json = await res.json();
  return json.content?.[0]?.text ?? 'Great work staying consistent this week!';
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  const { data: users } = await s
    .from('profiles')
    .select('id, email, display_name, full_name, email_notifications, plan_tier')
    .eq('email_notifications', true)
    .in('plan_tier', ['plus', 'pro']);

  if (!users?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const user of users.slice(0, 30)) {
    const [{ data: habits }, { data: streaks }] = await Promise.all([
      s.from('habits').select('title, streak_current, streak_best').eq('user_id', user.id),
      s.from('user_streaks').select('login_streak, login_streak_best').eq('user_id', user.id).maybeSingle(),
    ]);

    if (!habits?.length) continue;

    const name = user.display_name || user.full_name || 'there';
    const insight = await generateFitnessInsight(name, habits, streaks ?? {});

    await sendEmail({
      to: user.email,
      subject: 'Your weekly fitness & habits review 💪',
      html: templates.fitnessInsight(name, insight),
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
