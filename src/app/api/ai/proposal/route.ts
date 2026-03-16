import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  const { clientName, clientCompany, yourName, yourCompany, projectType, description, deliverables, timeline, budget, tone } = await req.json();
  if (!clientName || !description) return NextResponse.json({ error: 'clientName and description required' }, { status: 400 });

  const prompt = `Write a professional project proposal with these details:

Client: ${clientName}${clientCompany ? ` at ${clientCompany}` : ''}
From: ${yourName}${yourCompany ? ` at ${yourCompany}` : ''}
Project Type: ${projectType || 'General Project'}
Description: ${description}
${deliverables ? `Deliverables: ${deliverables}` : ''}
${timeline ? `Timeline: ${timeline}` : ''}
${budget ? `Budget: ${budget}` : ''}
Tone: ${tone || 'professional'}

Write a complete, polished proposal with these sections:
# Project Proposal
## Executive Summary
## Project Overview
## Scope of Work
## Deliverables
## Timeline
## Investment
## Why Us
## Next Steps

Make it compelling, specific, and ready to send. Use the details provided.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 3000, messages: [{ role: 'user', content: prompt }], stream: true }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.error?.message || 'AI error' }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const reader = res.body!.getReader();
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
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: parsed.delta.text })}\n\n`));
              }
              if (parsed.type === 'message_stop') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              }
            } catch {}
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
