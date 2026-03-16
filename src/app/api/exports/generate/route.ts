import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured. Add OPENAI_API_KEY.' }, { status: 503 });
  const { type, topic, context } = await req.json();
  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 });
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o',
      messages: [{ role: 'user', content: `Create a professional ${type || 'report'} about: ${topic}${context ? `\n\nContext: ${context}` : ''}\n\nUse markdown with # headings for sections. Make it comprehensive and well-structured.` }],
      max_tokens: 2048,
    }),
  });
  const d = await res.json();
  if (!res.ok) return NextResponse.json({ error: d.error?.message || 'OpenAI error' }, { status: 500 });
  return NextResponse.json({ content: d.choices?.[0]?.message?.content || '' });
}
