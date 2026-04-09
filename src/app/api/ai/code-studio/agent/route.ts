import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 180;

// ── Tools Claude can call ────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'read_file',
    description: 'Read the current contents of a file in the project. Always do this before modifying an existing file.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path, e.g. "App.jsx" or "components/Button.jsx"' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Create a new file or completely overwrite an existing one. ALWAYS write the full, complete file content — never partial, never truncated.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'Complete file content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files currently in the project',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_code',
    description: 'Execute Python or Node.js code in a secure cloud sandbox. Use this to verify your code works after writing it.',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to execute' },
        language: { type: 'string', enum: ['python', 'nodejs'] },
      },
      required: ['code', 'language'],
    },
  },
];

// ── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(language: string, fileNames: string[]): string {
  const fileList = fileNames.length > 0
    ? `Current project files:\n${fileNames.map(f => `  - ${f}`).join('\n')}`
    : 'The project is currently empty.';

  const langGuide = (language === 'python' || language === 'nodejs')
    ? `Language: ${language === 'python' ? 'Python 3' : 'Node.js'}
Write clean, idiomatic, well-structured code. Handle errors. Use run_code to verify after writing.`
    : language === 'react'
      ? `Language: React (JSX with ES modules)
Use ES module imports: import { useState } from 'react' — not React.useState globals.
Export default components. Import CSS files directly (import './App.css').
Build impressive, production-quality UIs. Use framer-motion for animations if needed.
npm packages available via esm.sh — no install needed.`
      : `Language: HTML / CSS / JavaScript
Write semantic HTML5, modern CSS (Grid/Flexbox), and vanilla JS.
No frameworks, no Bootstrap. Real content — no Lorem Ipsum.
Add hover effects, smooth transitions, and animations.`;

  return `You are an expert software engineer inside Omnia Code Studio — an AI coding agent with full file access via tools.

${langGuide}

━━━ CRITICAL RULES — FOLLOW EXACTLY ━━━
1. ALWAYS call list_files first to see what exists
2. ALWAYS call read_file before modifying any existing file
3. ALWAYS write code using write_file — NEVER put code in your text response
4. Write the COMPLETE file content every time — never partial, never truncated
5. For Python/Node.js: call run_code after writing to verify it works
6. After all writes are done: write 1-2 sentences summarising what you built (no code blocks)

If the project is empty, create all needed files from scratch.
If files exist, read them first, then overwrite with improvements.

━━━ TOOLS ━━━
- list_files  → see what files exist
- read_file   → read before editing
- write_file  → create or overwrite (ALWAYS full content)
- delete_file → remove a file
- run_code    → execute Python or Node.js and capture output

${fileList}`;
}

// ── E2B code execution ───────────────────────────────────────────────────────

async function runInSandbox(code: string, language: string, e2bKey: string): Promise<string> {
  try {
    const { CodeInterpreter } = await import('@e2b/code-interpreter');

    if (language === 'python') {
      const sandbox = await CodeInterpreter.create({ apiKey: e2bKey });
      try {
        const execution = await sandbox.notebook.execCell(code);
        await sandbox.close();
        if (execution.error) return `Error: ${execution.error.value}\n${execution.logs.stderr.join('\n')}`;
        return [execution.logs.stdout.join('\n'), execution.logs.stderr.join('\n')].filter(Boolean).join('\n') || '(no output)';
      } catch (e) { await sandbox.close(); throw e; }
    }

    if (language === 'nodejs') {
      const { Sandbox } = await import('@e2b/code-interpreter');
      const sandbox = await (Sandbox as any).create({ apiKey: e2bKey });
      try {
        await sandbox.files.write('index.js', code);
        const proc = await sandbox.process.start({ cmd: 'node index.js' });
        await proc.wait();
        await sandbox.close();
        return [proc.output.stdout, proc.output.stderr].filter(Boolean).join('\n') || '(no output)';
      } catch (e) { await sandbox.close(); throw e; }
    }

    return 'Unsupported language';
  } catch (err: any) {
    return `Execution error: ${err.message}`;
  }
}

// ── SSE helper ───────────────────────────────────────────────────────────────

function send(controller: ReadableStreamDefaultController, encoder: TextEncoder, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  const e2bKey = process.env.E2B_API_KEY;
  const { messages, files: inputFiles, language } = await req.json();

  if (!messages?.length) return NextResponse.json({ error: 'Messages required' }, { status: 400 });

  // Build mutable file map so tools can read/write during the loop
  const fileMap = new Map<string, string>();
  for (const f of (inputFiles || [])) fileMap.set(f.name, f.content);

  const systemPrompt = buildSystemPrompt(language || 'html', Array.from(fileMap.keys()));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const MAX_ITERATIONS = 20;
      const currentMessages = [...messages];

      try {
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          // ── Call Claude ──────────────────────────────────────────────────
          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 8192,
              system: systemPrompt,
              tools: TOOLS,
              messages: currentMessages,
              stream: true,
            }),
          });

          if (!claudeRes.ok) {
            const err = await claudeRes.text();
            send(controller, encoder, { type: 'error', message: `AI error: ${err}` });
            break;
          }

          // ── Parse streaming response ─────────────────────────────────────
          const reader = claudeRes.body!.getReader();
          const dec = new TextDecoder();

          const assistantContent: any[] = [];
          const toolResults: { id: string; content: string }[] = [];
          let stopReason = 'end_turn';
          let curText = '';
          let curTool: { id: string; name: string; json: string } | null = null;

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

              if (ev.type === 'content_block_start') {
                if (ev.content_block.type === 'text') {
                  curText = '';
                } else if (ev.content_block.type === 'tool_use') {
                  if (curText) { assistantContent.push({ type: 'text', text: curText }); curText = ''; }
                  curTool = { id: ev.content_block.id, name: ev.content_block.name, json: '' };
                }

              } else if (ev.type === 'content_block_delta') {
                if (ev.delta.type === 'text_delta') {
                  curText += ev.delta.text;
                  send(controller, encoder, { type: 'text', text: ev.delta.text });
                } else if (ev.delta.type === 'input_json_delta' && curTool) {
                  curTool.json += ev.delta.partial_json;
                }

              } else if (ev.type === 'content_block_stop') {
                if (curText) {
                  assistantContent.push({ type: 'text', text: curText });
                  curText = '';
                }
                if (curTool) {
                  const tool = curTool;
                  let input: any = {};
                  try { input = JSON.parse(tool.json || '{}'); } catch {}

                  assistantContent.push({ type: 'tool_use', id: tool.id, name: tool.name, input });

                  // ── Notify client which tool is running ──────────────────
                  send(controller, encoder, { type: 'tool_call', tool: tool.name, path: input.path, language: input.language });

                  // ── Execute tool ─────────────────────────────────────────
                  let result = '';

                  if (tool.name === 'read_file') {
                    result = fileMap.has(input.path) ? fileMap.get(input.path)! : `File not found: ${input.path}`;

                  } else if (tool.name === 'write_file') {
                    fileMap.set(input.path, input.content ?? '');
                    result = `Written: ${input.path}`;
                    send(controller, encoder, { type: 'file_update', path: input.path, content: input.content ?? '' });

                  } else if (tool.name === 'list_files') {
                    const names = Array.from(fileMap.keys());
                    result = names.length > 0 ? names.join('\n') : '(empty project)';

                  } else if (tool.name === 'delete_file') {
                    const had = fileMap.has(input.path);
                    fileMap.delete(input.path);
                    result = had ? `Deleted: ${input.path}` : `Not found: ${input.path}`;
                    if (had) send(controller, encoder, { type: 'file_delete', path: input.path });

                  } else if (tool.name === 'run_code') {
                    if (!e2bKey) {
                      result = 'E2B_API_KEY not configured — cannot execute code in this environment';
                    } else {
                      result = await runInSandbox(input.code, input.language, e2bKey);
                      send(controller, encoder, { type: 'run_output', output: result });
                    }
                  }

                  toolResults.push({ id: tool.id, content: result });
                  curTool = null;
                }

              } else if (ev.type === 'message_delta') {
                stopReason = ev.delta.stop_reason ?? 'end_turn';
              }
            }
          }

          // Add assistant turn to history
          currentMessages.push({ role: 'assistant', content: assistantContent });

          // If Claude is done (not requesting more tool calls), stop
          if (stopReason !== 'tool_use' || toolResults.length === 0) break;

          // Otherwise feed tool results back and loop
          currentMessages.push({
            role: 'user',
            content: toolResults.map(r => ({ type: 'tool_result', tool_use_id: r.id, content: r.content })),
          });
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
