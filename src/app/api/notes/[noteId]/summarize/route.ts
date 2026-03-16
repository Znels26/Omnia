import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
  const { noteId } = await params;
  const s = createAdminSupabaseClient();
  const { data: note } = await s.from('notes').select('content').eq('id', noteId).eq('user_id', user.id).single();
  if (!note?.content?.trim()) return NextResponse.json({ error: 'No content to summarize' }, { status: 400 });
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini', messages: [{ role: 'user', content: `Summarize this in 2-3 sentences:\n\n${note.content.slice(0, 8000)}` }], max_tokens: 256 }),
  });
  const d = await res.json();
  const summary = d.choices?.[0]?.message?.content || '';
  const { data: updated } = await s.from('notes').update({ ai_summary: summary }).eq('id', noteId).eq('user_id', user.id).select().single();
  return NextResponse.json({ note: updated, summary });
}
