import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function condenseMemory(rawMemory: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return rawMemory;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are condensing a user's AI memory store. Remove duplicates, merge similar facts, and keep only the most important and recent information. Keep it under 400 words. Original memory:\n\n${rawMemory}`,
      }],
    }),
  });
  if (!res.ok) return rawMemory;
  const json = await res.json();
  return json.content?.[0]?.text ?? rawMemory;
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  // Get users with memories longer than 1000 chars (needs condensing)
  const { data: memories } = await s
    .from('profiles')
    .select('id')
    .not('assistant_mode', 'is', null);

  // Check memories table if it exists (from memories API)
  const { data: userMemories } = await s
    .from('chat_messages')
    .select('user_id, content')
    .eq('role', 'assistant')
    .gte('tokens_used', 200) // Long messages likely contain memory
    .order('created_at', { ascending: false })
    .limit(500);

  // Group by user and find those with excessive history
  const userTokens: Record<string, number> = {};
  for (const msg of userMemories ?? []) {
    userTokens[msg.user_id] = (userTokens[msg.user_id] ?? 0) + (msg.content?.length ?? 0);
  }

  const heavyUsers = Object.entries(userTokens)
    .filter(([, size]) => size > 10000)
    .map(([userId]) => userId);

  // For each heavy user, trim oldest messages to save storage
  let trimmed = 0;
  for (const userId of heavyUsers.slice(0, 20)) { // Process max 20 per run
    const nintyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: oldMessages } = await s
      .from('chat_messages')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', nintyDaysAgo)
      .eq('role', 'assistant')
      .select('id');
    if (oldMessages?.length) trimmed++;
  }

  return NextResponse.json({ processed: heavyUsers.length, trimmed });
}
