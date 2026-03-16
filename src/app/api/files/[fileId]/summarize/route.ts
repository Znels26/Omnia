import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured. Add ANTHROPIC_API_KEY.' }, { status: 503 });

  const { fileId } = await params;
  const s = createAdminSupabaseClient();
  const { data: file } = await s.from('files').select('*').eq('id', fileId).eq('user_id', user.id).single();
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const context = `File: "${file.name}" (${file.file_type?.toUpperCase()}, ${Math.round(file.size_bytes / 1024)}KB)`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: `Based on the filename and type, provide a helpful 2-3 sentence summary and 3 key points for: ${context}` }],
    }),
  });

  const d = await res.json();
  if (!res.ok) return NextResponse.json({ error: d.error?.message || 'AI error' }, { status: 500 });

  const summary = d.content?.[0]?.text || '';
  const { data: updated } = await s.from('files').update({ ai_summary: summary }).eq('id', fileId).eq('user_id', user.id).select().single();
  return NextResponse.json({ file: updated, summary });
}
