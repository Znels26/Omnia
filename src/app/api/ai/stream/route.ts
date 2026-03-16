import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPTS: Record<string, string> = {
  general: 'You are Omnia, a helpful AI assistant. Be concise, clear, and genuinely useful.',
  productivity: 'You are Omnia in Productivity mode. Help users organize work, manage tasks, and get more done.',
  writing: 'You are Omnia in Writing mode. Help users write, edit, and improve their content.',
  study: 'You are Omnia in Study mode. Help users learn, understand topics, and create study materials.',
  planning: 'You are Omnia in Planning mode. Help users plan projects, set goals, and think through strategies.',
  documents: 'You are Omnia in Documents mode. Help users analyze documents and extract key information.',
};

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured. Add ANTHROPIC_API_KEY to environment variables.' }, { status: 503 });

  const body = await req.json();
  const { chatId, content, mode = 'general', messages = [] } = body;

  if (!chatId || !content?.trim()) {
    return NextResponse.json({ error: 'chatId and content required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const basePrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.general;

  // Fetch user memories to personalise responses
  const { data: memoriesData } = await supabase.from('memories').select('content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
  const memories = memoriesData || [];
  const systemPrompt = memories.length > 0
    ? `${basePrompt}\n\nWhat you remember about this user:\n${memories.map((m: any, i: number) => `${i + 1}. ${m.content}`).join('\n')}`
    : basePrompt;

  // Save user message and kick off Anthropic call in parallel
  const [, anthropicResponse] = await Promise.all([
    supabase.from('chat_messages').insert({ chat_id: chatId, user_id: user.id, role: 'user', content: content.trim() }),
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          ...messages.slice(-8).map((m: any) => ({ role: m.role, content: m.content })),
          { role: 'user', content: content.trim() },
        ],
        stream: true,
      }),
    }),
  ]);

  if (!anthropicResponse.ok) {
    const err = await anthropicResponse.json();
    return NextResponse.json({ error: err.error?.message || 'Anthropic API error' }, { status: 502 });
  }

  const encoder = new TextEncoder();
  let accumulated = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const reader = anthropicResponse.body!.getReader();
        const dec = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          for (const line of dec.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]' || !data) continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                const token = parsed.delta.text || '';
                if (token) {
                  accumulated += token;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              }

              if (parsed.type === 'message_stop') {
                // Parallelize all post-stream DB writes
                const [{ data: msg }] = await Promise.all([
                  supabase.from('chat_messages').insert({ chat_id: chatId, user_id: user.id, role: 'assistant', content: accumulated }).select().single(),
                  supabase.from('chats').update({
                    last_message_at: new Date().toISOString(),
                    ...(messages.length === 0 ? { title: content.slice(0, 60) } : {}),
                  }).eq('id', chatId).eq('user_id', user.id),
                  supabase.from('usage_counters').select('ai_requests_used').eq('user_id', user.id).single().then(({ data: u }) =>
                    u ? supabase.from('usage_counters').update({ ai_requests_used: (u.ai_requests_used || 0) + 1 }).eq('user_id', user.id) : null
                  ),
                ]);

                if (msg) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ finalMessage: msg })}\n\n`));
                }
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || 'Stream error' })}\n\n`));
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
