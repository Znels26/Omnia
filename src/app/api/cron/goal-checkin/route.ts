import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function analyzeGoals(name: string, goals: any[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !goals.length) return 'Keep pushing towards your goals. Every step counts!';

  const prompt = `You are Omnia, a goal-tracking AI. Write a brief, motivating 2-3 paragraph goal check-in for ${name}:

Goals:
${goals.map((g: any) => `- ${g.title}: ${g.progress}% complete${g.target_date ? `, target: ${g.target_date}` : ''}`).join('\n')}

Be encouraging, identify which goal needs the most attention, and give one actionable tip. Keep it under 200 words.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) return 'Keep pushing towards your goals!';
  const json = await res.json();
  return json.content?.[0]?.text || 'Keep pushing!';
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const { data: profiles } = await s.from('profiles').select('id, email, display_name, full_name').eq('email_notifications', true);
  if (!profiles?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    profiles.map(async (profile) => {
      const { data: goals } = await s
        .from('goals')
        .select('title, progress, target_date')
        .eq('user_id', profile.id)
        .eq('is_completed', false);

      if (!goals?.length) return;

      const name = profile.display_name || profile.full_name || 'there';
      const analysis = await analyzeGoals(name, goals);
      await sendEmail({
        to: profile.email,
        subject: 'Your Weekly Goal Check-in 🎯',
        html: templates.goalCheckin(name, analysis),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
