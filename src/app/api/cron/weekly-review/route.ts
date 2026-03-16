import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function generateWeeklySummary(profile: any, tasks: any[], goals: any[], notes: any[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 'Great work this week! Keep up the momentum.';

  const prompt = `You are Omnia, a productivity AI. Write a warm, encouraging 3-4 paragraph weekly review for ${profile.display_name || 'the user'} based on their week:

Tasks completed: ${tasks.filter((t: any) => t.status === 'completed').length} of ${tasks.length}
Goals progress: ${goals.map((g: any) => `${g.title}: ${g.progress}%`).join(', ') || 'No active goals'}
Notes created: ${notes.length}

Be specific, motivating, and suggest 1-2 focus areas for next week. Keep it concise.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) return 'Great work this week! Keep up the momentum.';
  const json = await res.json();
  return json.content?.[0]?.text || 'Great work this week!';
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: profiles } = await s.from('profiles').select('id, display_name, full_name');
  if (!profiles?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    profiles.map(async (profile) => {
      const [{ data: tasks }, { data: goals }, { data: notes }] = await Promise.all([
        s.from('tasks').select('title, status').eq('user_id', profile.id).gte('created_at', weekAgo),
        s.from('goals').select('title, progress').eq('user_id', profile.id).eq('is_completed', false),
        s.from('notes').select('id').eq('user_id', profile.id).gte('created_at', weekAgo),
      ]);

      const summary = await generateWeeklySummary(profile, tasks || [], goals || [], notes || []);
      await queueEmail({
        userId: profile.id,
        emailType: 'weekly_review',
        priority: 3,
        subject: 'Your Omnia Weekly Review',
        html: templates.weeklyReview(profile.display_name || 'there', summary),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
