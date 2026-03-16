import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured. Add ANTHROPIC_API_KEY.' }, { status: 503 });

  const { noteId } = await params;
  const s = createAdminSupabaseClient();
  const { data: note } = await s.from('notes').select('content').eq('id', noteId).eq('user_id', user.id).single();
  if (!note?.content?.trim()) return NextResponse.json({ error: 'No content to summarize' }, { status: 400 });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: `Summarize this note in 2-3 clear sentences:\n\n${note.content.slice(0, 8000)}` }],
    }),
  });

  const d = await res.json();
  if (!res.ok) return NextResponse.json({ error: d.error?.message || 'AI error' }, { status: 500 });

  const summary = d.content?.[0]?.text || '';
  const { data: updated } = await s.from('notes').update({ ai_summary: summary }).eq('id', noteId).eq('user_id', user.id).select().single();
  return NextResponse.json({ note: updated, summary });
}
