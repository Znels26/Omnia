import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function generateIdeas(name: string, recentContent: string[]): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [
    'Share a behind-the-scenes look at your workflow',
    'Write about a recent challenge you overcame',
    'Create a tips post from your top 3 lessons this week',
    'Share a client success story (with permission)',
    'Post about a tool or system that changed how you work',
  ];

  const context = recentContent.length > 0
    ? `Recent content topics: ${recentContent.slice(0, 5).join(', ')}`
    : 'No recent content history';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Generate 5 unique, engaging content ideas for ${name}. ${context}. Return ONLY a JSON array of 5 strings, no other text.`,
      }],
    }),
  });

  if (!res.ok) return ['Share your biggest win this week', 'Write about a challenge you solved', 'Post a productivity tip', 'Share a client testimonial', 'Create a how-to guide'];

  try {
    const json = await res.json();
    const text = json.content?.[0]?.text ?? '[]';
    const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return ['Share your biggest win this week', 'Write about a challenge you solved', 'Post a productivity tip'];
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  // Only send to plus/pro users
  const { data: users } = await s
    .from('profiles')
    .select('id, email, display_name, full_name, plan_tier')
    .in('plan_tier', ['plus', 'pro']);

  if (!users?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  // Process max 50 users per night to control AI costs
  for (const user of users.slice(0, 50)) {
    const { data: recentContent } = await s
      .from('content_items')
      .select('prompt')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const name = user.display_name || user.full_name || 'there';
    const ideas = await generateIdeas(name, (recentContent ?? []).map((c: any) => c.prompt));

    if (ideas.length === 0) continue;

    await queueEmail({
      userId: user.id,
      emailType: 'content_ideas',
      priority: 4,
      subject: `Your 5 personalised content ideas this week`,
      html: templates.contentIdeas(name, ideas),
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
