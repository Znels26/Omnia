import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tavilyKey = process.env.TAVILY_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!tavilyKey) return NextResponse.json({ error: 'Web search not configured. Add TAVILY_API_KEY.' }, { status: 503 });
  if (!anthropicKey) return NextResponse.json({ error: 'AI not configured.' }, { status: 503 });

  const { chatId, query, messages = [] } = await req.json();
  if (!chatId || !query?.trim()) return NextResponse.json({ error: 'chatId and query required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();

  await supabase.from('chat_messages').insert({ chat_id: chatId, user_id: user.id, role: 'user', content: query.trim() });

  // Fetch Tavily results
  let searchContext = '';
  let sources: { title: string; url: string }[] = [];
  try {
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: query.trim(),
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
      }),
    });
    if (tavilyRes.ok) {
      const data = await tavilyRes.json();
      const results = (data.results || []).slice(0, 5);
      sources = results.map((r: any) => ({ title: r.title, url: r.url }));
      searchContext =
        results.map((r: any, i: number) => `[${i + 1}] **${r.title}**\nSource: ${r.url}\n${r.content?.slice(0, 500)}`).join('\n\n') +
        (data.answer ? `\n\nDirect answer: ${data.answer}` : '');
    }
  } catch {}

  const systemPrompt = searchContext
    ? `You are Omnia, an AI assistant with real-time web search. Use the search results below to answer accurately. Cite sources inline using [1], [2] etc. Be concise and helpful.\n\n---\nSearch results for: "${query}"\n\n${searchContext}\n---`
    : 'You are Omnia, a helpful AI assistant. Be concise and genuinely useful.';

  const anthropicMessages = [
    ...messages.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: query.trim() },
  ];

  const encoder = new TextEncoder();
  let accumulated = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            messages: anthropicMessages,
            stream: true,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.error?.message || 'Search error' })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        // Send sources immediately so the UI can show them early
        if (sources.length) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`));
        }

        const reader = response.body!.getReader();
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
                const [{ data: msg }] = await Promise.all([
                  supabase.from('chat_messages').insert({ chat_id: chatId, user_id: user.id, role: 'assistant', content: accumulated }).select().single() as any,
                  supabase.from('chats').update({ last_message_at: new Date().toISOString(), ...(messages.length === 0 ? { title: query.slice(0, 60) } : {}) }).eq('id', chatId).eq('user_id', user.id),
                ]);
                if (msg) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ finalMessage: msg })}\n\n`));
              }
            } catch {}
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || 'Search failed' })}\n\n`));
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
