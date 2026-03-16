import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  const { prompt, language, files } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  const fileContext = (files || [])
    .map((f: { name: string; content: string }) => `=== ${f.name} ===\n${f.content}`)
    .join('\n\n');

  const langNames: Record<string, string> = {
    html: 'HTML/CSS/JS',
    react: 'React (JSX)',
    python: 'Python',
    nodejs: 'Node.js',
  };

  const systemPrompt = `You are an expert ${langNames[language] || 'web'} developer.
When generating or modifying code:
- Write clean, modern, well-commented code
- For HTML/CSS/JS: output complete, working files
- For React: write a self-contained App component (no imports needed, React/ReactDOM available globally)
- For Python/Node.js: write clean executable scripts
- Always output COMPLETE file contents, never partial snippets
- After the code, briefly explain what you built/changed (1-2 sentences)

Output format — for each file you create or modify, use this exact format:
=== filename.ext ===
[complete file content]
===END===

Then add a brief explanation.`;

  const userMessage = files?.length
    ? `Current project files:\n\n${fileContext}\n\nRequest: ${prompt}`
    : `Create a new ${langNames[language] || ''} project: ${prompt}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.delta?.text || '';
              if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            } catch {}
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
