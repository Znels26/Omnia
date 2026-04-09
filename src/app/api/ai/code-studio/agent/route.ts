import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 180;

// ── SSE helper ───────────────────────────────────────────────────────────────

function send(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

// ── Streaming XML file parser ─────────────────────────────────────────────────
// Parses Claude's output looking for:
//   <write_file path="filename.ext">
//   ...content...
//   </write_file>
// Emits ParsedEvent objects as it scans chunks.

type ParsedEvent =
  | { type: 'text'; text: string }
  | { type: 'file_start'; path: string }
  | { type: 'file_chunk'; path: string; chunk: string }
  | { type: 'file_done'; path: string; content: string };

class FileParser {
  private buffer = '';
  private state: 'text' | 'in_file' = 'text';
  private currentPath = '';
  private currentContent = '';
  // Safety window: hold back this many chars so partial tags aren't emitted as text
  private readonly WINDOW = 50;

  process(incoming: string): ParsedEvent[] {
    this.buffer += incoming;
    const events: ParsedEvent[] = [];

    while (true) {
      if (this.state === 'text') {
        // Look for <write_file path="...">
        const openIdx = this.buffer.indexOf('<write_file ');
        if (openIdx === -1) {
          // No opening tag found — emit everything except safety window
          const safe = Math.max(0, this.buffer.length - this.WINDOW);
          if (safe > 0) {
            const text = this.buffer.slice(0, safe);
            this.buffer = this.buffer.slice(safe);
            if (text) events.push({ type: 'text', text });
          }
          break;
        }

        // Emit text before the tag
        if (openIdx > 0) {
          events.push({ type: 'text', text: this.buffer.slice(0, openIdx) });
          this.buffer = this.buffer.slice(openIdx);
        }

        // Try to find the closing > of the opening tag
        const closeAngle = this.buffer.indexOf('>');
        if (closeAngle === -1) break; // partial tag — wait for more data

        const tagStr = this.buffer.slice(0, closeAngle + 1);
        // Extract path attribute
        const pathMatch = tagStr.match(/path="([^"]+)"/);
        if (!pathMatch) {
          // Malformed tag — treat as text and skip past it
          events.push({ type: 'text', text: tagStr });
          this.buffer = this.buffer.slice(closeAngle + 1);
          continue;
        }

        this.currentPath = pathMatch[1];
        this.currentContent = '';
        this.state = 'in_file';
        this.buffer = this.buffer.slice(closeAngle + 1);
        events.push({ type: 'file_start', path: this.currentPath });

      } else {
        // state === 'in_file': scan for </write_file>
        const closeTag = '</write_file>';
        const closeIdx = this.buffer.indexOf(closeTag);

        if (closeIdx === -1) {
          // Not found — emit everything except safety window
          const safe = Math.max(0, this.buffer.length - this.WINDOW);
          if (safe > 0) {
            const chunk = this.buffer.slice(0, safe);
            this.buffer = this.buffer.slice(safe);
            this.currentContent += chunk;
            events.push({ type: 'file_chunk', path: this.currentPath, chunk });
          }
          break;
        }

        // Emit everything up to the close tag
        const finalChunk = this.buffer.slice(0, closeIdx);
        this.buffer = this.buffer.slice(closeIdx + closeTag.length);
        this.currentContent += finalChunk;
        if (finalChunk) {
          events.push({ type: 'file_chunk', path: this.currentPath, chunk: finalChunk });
        }
        events.push({ type: 'file_done', path: this.currentPath, content: this.currentContent });
        this.state = 'text';
        this.currentPath = '';
        this.currentContent = '';
      }
    }

    return events;
  }

  flush(): ParsedEvent[] {
    const events: ParsedEvent[] = [];
    if (this.state === 'in_file' && this.currentContent) {
      // Unclosed file tag — still emit what we have
      if (this.buffer) {
        this.currentContent += this.buffer;
        events.push({ type: 'file_chunk', path: this.currentPath, chunk: this.buffer });
        this.buffer = '';
      }
      events.push({ type: 'file_done', path: this.currentPath, content: this.currentContent });
    } else if (this.buffer.trim()) {
      events.push({ type: 'text', text: this.buffer });
      this.buffer = '';
    }
    return events;
  }
}

// ── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(language: string, fileNames: string[]): string {
  const hasFiles = fileNames.length > 0;
  const fileList = hasFiles
    ? `Current project files:\n${fileNames.map(f => `  - ${f}`).join('\n')}`
    : 'The project is currently empty.';

  const langGuide =
    language === 'python'
      ? `Language: Python 3. Write clean, idiomatic Python. Use if __name__ == '__main__' guards.`
      : language === 'nodejs'
      ? `Language: Node.js. Write clean CommonJS or ESM modules as appropriate. Include package.json.`
      : language === 'react'
      ? `Language: React (JSX + ES modules).
- Use ES module imports: import { useState } from 'react'
- npm packages via esm.sh CDN in HTML: <script type="importmap">
- Export default components. Import CSS directly if needed.
- Build impressive, production-quality UIs with beautiful design.
- Include a complete index.html that bootstraps the React app via CDN.`
      : `Language: HTML / CSS / JavaScript (vanilla).
- Write semantic HTML5, modern CSS (Grid/Flexbox/custom properties/animations), vanilla JS.
- No frameworks, no Bootstrap. Real content — no Lorem Ipsum.
- Include hover effects, transitions, and polished visual design.`;

  const fullStackGuide = `
━━━ FULL-STACK CAPABILITIES ━━━
You can create complete full-stack applications:
- Frontend: HTML/CSS/JS, React, Vue, Svelte (via CDN)
- Backend APIs: api/index.js (Express), api/route.py (FastAPI/Flask)
- Config: vercel.json for routing/serverless, package.json for dependencies
- Databases: reference Supabase, PlanetScale, etc. (provide connection setup)
- Auth: show JWT, cookie, OAuth patterns
- Deployment: structure files for Vercel, Netlify, Railway, Render

For Vercel deployment always include vercel.json when there are API routes.
For Node.js APIs always include package.json with dependencies.`;

  return `You are an expert full-stack software engineer in Omnia Code Studio.
You help users build complete, production-quality applications.

${langGuide}
${fullStackGuide}

${fileList}

━━━ CRITICAL OUTPUT FORMAT ━━━
You MUST write ALL code using this EXACT XML format and NOTHING else for code:

<write_file path="filename.ext">
COMPLETE file content here — never truncated, never partial
</write_file>

RULES:
1. START writing files IMMEDIATELY — no planning text, no explanations before files.
2. Write the COMPLETE file content every time — never use "..." or "// rest unchanged".
3. You may write multiple files one after another.
4. After ALL files are written, write ONE short sentence describing what was built. Nothing more.
5. NEVER output code blocks in your text. ALL code goes inside <write_file> tags ONLY.
6. If modifying existing files: rewrite the complete updated file — include unchanged parts too.

${hasFiles ? 'Files exist — rewrite any file you modify in full.' : 'Project is empty — create all needed files from scratch immediately.'}`;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  const { messages, files: inputFiles, language } = await req.json();
  if (!messages?.length) return NextResponse.json({ error: 'Messages required' }, { status: 400 });

  const fileMap = new Map<string, string>();
  for (const f of (inputFiles || [])) fileMap.set(f.name, f.content);

  const systemPrompt = buildSystemPrompt(language || 'html', Array.from(fileMap.keys()));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let wroteAnyFile = false;

        const runPass = async (msgs: any[]): Promise<boolean> => {
          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 16000,
              system: systemPrompt,
              messages: msgs,
              stream: true,
            }),
          });

          if (!claudeRes.ok) {
            const err = await claudeRes.text();
            send(controller, encoder, { type: 'error', message: `AI error: ${err}` });
            return false;
          }

          const reader = claudeRes.body!.getReader();
          const dec = new TextDecoder();
          const parser = new FileParser();
          let fullText = '';
          let passWroteFile = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = dec.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6);
              if (raw === '[DONE]') continue;
              let ev: any;
              try { ev = JSON.parse(raw); } catch { continue; }

              if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
                const text = ev.delta.text as string;
                fullText += text;

                const events = parser.process(text);
                for (const pe of events) {
                  if (pe.type === 'text') {
                    send(controller, encoder, { type: 'text', text: pe.text });
                  } else if (pe.type === 'file_start') {
                    send(controller, encoder, { type: 'file_start', path: pe.path });
                  } else if (pe.type === 'file_chunk') {
                    send(controller, encoder, { type: 'file_chunk', path: pe.path, chunk: pe.chunk });
                  } else if (pe.type === 'file_done') {
                    passWroteFile = true;
                    fileMap.set(pe.path, pe.content);
                    send(controller, encoder, { type: 'file_done', path: pe.path, content: pe.content });
                  }
                }
              }
            }
          }

          // Flush remaining buffer
          const flushEvents = parser.flush();
          for (const pe of flushEvents) {
            if (pe.type === 'text') {
              send(controller, encoder, { type: 'text', text: pe.text });
            } else if (pe.type === 'file_chunk') {
              send(controller, encoder, { type: 'file_chunk', path: pe.path, chunk: pe.chunk });
            } else if (pe.type === 'file_done') {
              passWroteFile = true;
              fileMap.set(pe.path, pe.content);
              send(controller, encoder, { type: 'file_done', path: pe.path, content: pe.content });
            }
          }

          if (passWroteFile) wroteAnyFile = true;
          return passWroteFile;
        };

        // First pass
        await runPass(messages);

        // Nudge pass if no files were written
        if (!wroteAnyFile) {
          send(controller, encoder, { type: 'text', text: '\n\n' });
          const nudgedMessages = [
            ...messages,
            {
              role: 'assistant',
              content: 'I\'ll write the files now.',
            },
            {
              role: 'user',
              content: 'Write the files NOW using <write_file path="...">content</write_file> format. Start immediately — no explanation.',
            },
          ];
          await runPass(nudgedMessages);
        }

        send(controller, encoder, { type: 'done' });
      } catch (err: any) {
        send(controller, encoder, { type: 'error', message: err.message ?? 'Agent error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
