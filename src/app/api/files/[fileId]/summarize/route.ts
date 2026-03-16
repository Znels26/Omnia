import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
  const { fileId } = await params;
  const s = createAdminSupabaseClient();
  const { data: file } = await s.from('files').select('*').eq('id', fileId).eq('user_id', user.id).single();
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });
  const context = `File: "${file.name}" (${file.file_type?.toUpperCase()}, ${Math.round(file.size_bytes/1024)}KB)`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini', messages: [{ role: 'user', content: `Based on the filename and type, provide a helpful summary and 3 key points for: ${context}` }], max_tokens: 300 }),
  });
  const d = await res.json();
  const summary = d.choices?.[0]?.message?.content || '';
  const { data: updated } = await s.from('files').update({ ai_summary: summary }).eq('id', fileId).eq('user_id', user.id).select().single();
  return NextResponse.json({ file: updated, summary });
}
