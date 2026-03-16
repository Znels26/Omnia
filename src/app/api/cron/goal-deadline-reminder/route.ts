import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function generateMotivation(goalTitle: string, progress: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return `You're at ${progress}% — keep pushing. You've got 7 days to finish strong.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: `Write a 2-sentence motivational message for someone with a goal "${goalTitle}" at ${progress}% progress with 7 days left. Be specific and energetic.` }],
    }),
  });
  if (!res.ok) return `You're at ${progress}% — 7 days left to nail this goal!`;
  const json = await res.json();
  return json.content?.[0]?.text ?? `You're at ${progress}% — keep going!`;
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const eightDaysFromNow = new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0];

  const { data: goals } = await s
    .from('goals')
    .select('id, user_id, title, progress, target_date, profiles(email, display_name, full_name, email_notifications)')
    .eq('is_completed', false)
    .gte('target_date', sevenDaysFromNow)
    .lt('target_date', eightDaysFromNow);

  if (!goals?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    goals.map(async (goal: any) => {
      const profile = goal.profiles;
      if (!profile?.email_notifications) return;

      const name = profile.display_name || profile.full_name || 'there';
      const motivation = await generateMotivation(goal.title, goal.progress);

      await sendEmail({
        to: profile.email,
        subject: `7 days left on your goal: ${goal.title}`,
        html: templates.goalDeadlineReminder(name, goal.title, 7, motivation),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
