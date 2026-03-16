import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured. Add ANTHROPIC_API_KEY.' }, { status: 503 });

  const { type, prompt, platform, tone } = await req.json();
  if (!type || !prompt) return NextResponse.json({ error: 'type and prompt required' }, { status: 400 });

  const systemPrompt = `You are an expert content creator. Generate high-quality ${type.replace('_', ' ')} content.${tone ? ` Use a ${tone} tone.` : ''}${platform ? ` Optimize for ${platform}.` : ''} Be creative, engaging, and authentic.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const d = await res.json();
  if (!res.ok) return NextResponse.json({ error: d.error?.message || 'AI error' }, { status: 500 });

  const output = d.content?.[0]?.text || '';
  const s = createAdminSupabaseClient();
  const { data: item } = await s.from('content_items').insert({
    user_id: user.id, type, prompt, output,
    platform: platform || null, tone: tone || null,
  }).select().single();

  const { data: u } = await s.from('usage_counters').select('content_count').eq('user_id', user.id).single();
  if (u) await s.from('usage_counters').update({ content_count: (u.content_count || 0) + 1 }).eq('user_id', user.id);
  revalidateTag('content');
  return NextResponse.json({ item }, { status: 201 });
}
