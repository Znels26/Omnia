import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured. Add ANTHROPIC_API_KEY.' }, { status: 503 });

  const { type, topic, context } = await req.json();
  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Create a professional ${type || 'report'} about: ${topic}${context ? `\n\nContext: ${context}` : ''}\n\nUse markdown with # headings for sections. Make it comprehensive and well-structured.`,
      }],
    }),
  });

  const d = await res.json();
  if (!res.ok) return NextResponse.json({ error: d.error?.message || 'AI error' }, { status: 500 });

  return NextResponse.json({ content: d.content?.[0]?.text || '' });
}
