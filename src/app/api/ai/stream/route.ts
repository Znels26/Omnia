import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const FEATURE_CONTEXT = `
Omnia is an all-in-one productivity platform. You have access to these built-in tools — mention or suggest them naturally when relevant:
- Planner (/planner): tasks, goals, deadlines, recurring tasks, project planning
- Notes (/notes): save ideas, research, meeting summaries, journal entries
- Files (/files): upload and organise documents, images, and files
- Content Studio (/content-studio): AI-generated captions, social posts, blog drafts, video scripts, rewrites, tone changes
- AI Money Tools (/ai-tools): lead magnet builder, SEO blog writer, email sequences, passive income ideas, proposal generator
- Life Hub (/life-hub): fitness (workout plans, meal plans, macro/calorie tracking, supplement guides, challenges), finance (budget planner, investment ideas, debt payoff, savings goals, tax estimator, net worth tracker)
- Document Builder (/document-builder): create and export PDF, Word, Excel, PowerPoint, Markdown documents with AI assistance
- Invoices (/invoices): create, send, and track invoices for clients
- Reminders (/reminders): time-based and recurring reminders with notifications
- Proposals (/proposal): AI-generated client proposals
- My Stack (/my-stack): track software subscriptions and tools
When a topic naturally connects to one of these features, weave in a brief mention (e.g. "you could save this plan in Planner" or "Life Hub's budget tool would be great for this"). Keep it natural — never force it.`.trim();

const FORMATTING_GUIDE = `
Formatting rules:
- Write naturally and conversationally for short answers — plain prose, no markdown symbols.
- Only use bullet points or numbered lists when there are genuinely 3+ distinct items to list.
- Use **bold** only for truly critical terms or key phrases, not for decoration.
- Use headers (## or ###) only when a response is long enough to need sections (e.g. a structured plan or guide).
- Never use horizontal rules (---), excessive line breaks, or ornamental symbols.
- Never wrap a single sentence in bold just to emphasise it — write the sentence clearly instead.
- Code and technical strings belong in backtick code blocks.
- Keep responses focused and appropriately concise — don't pad with filler.`.trim();

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are Omnia, a helpful AI assistant built into a productivity platform. Be concise, clear, and genuinely useful.\n\n${FEATURE_CONTEXT}\n\n${FORMATTING_GUIDE}`,
  productivity: `You are Omnia in Productivity mode. Help users organise work, manage tasks, and get more done. Suggest the Planner for task lists, Notes for capturing ideas, and Reminders for follow-ups.\n\n${FEATURE_CONTEXT}\n\n${FORMATTING_GUIDE}`,
  writing: `You are Omnia in Writing mode. Help users write, edit, and improve their content. Suggest Content Studio for social/blog content and Document Builder for formal documents.\n\n${FEATURE_CONTEXT}\n\n${FORMATTING_GUIDE}`,
  study: `You are Omnia in Study mode. Help users learn, understand topics, and create study materials. Suggest Notes for saving summaries and Planner for study schedules.\n\n${FEATURE_CONTEXT}\n\n${FORMATTING_GUIDE}`,
  planning: `You are Omnia in Planning mode. Help users plan projects, set goals, and think through strategies. Suggest the Planner for task management, Notes for ideas, and Reminders for deadlines.\n\n${FEATURE_CONTEXT}\n\n${FORMATTING_GUIDE}`,
  documents: `You are Omnia in Documents mode. Help users analyse documents and extract key information. Suggest Document Builder for creating new documents and Notes for saving insights.\n\n${FEATURE_CONTEXT}\n\n${FORMATTING_GUIDE}`,
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
