import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANALYSIS_SYSTEM_PROMPT = `You are an expert at analysing AI conversation history and extracting structured information. Analyse the provided conversations and extract: 1) categories (fitness, finance, tasks, goals, content, code, business, learning, personal) 2) key personal facts 3) goals mentioned 4) tasks/action items mentioned 5) habits mentioned 6) a brief summary of what you learned about this person. Return ONLY valid JSON with this structure: { categories: { fitness: string[], finance: string[], tasks: string[], goals: string[], content: string[], code: string[], business: string[], learning: string[], personal: string[] }, keyFacts: string[], goals: string[], tasks: string[], habits: string[], summary: string, recommendedPersona: string }`;

type AnalysisResult = {
  categories: {
    fitness: string[];
    finance: string[];
    tasks: string[];
    goals: string[];
    content: string[];
    code: string[];
    business: string[];
    learning: string[];
    personal: string[];
  };
  keyFacts: string[];
  goals: string[];
  tasks: string[];
  habits: string[];
  summary: string;
  recommendedPersona: string;
};

function detectPlatformFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('chatgpt_conversations') || lower.includes('chatgpt')) return 'chatgpt';
  if (lower === 'conversations.json' || lower.includes('claude')) return 'claude';
  if (lower.includes('gemini')) return 'gemini';
  return 'unknown';
}

function extractTextFromConversations(raw: unknown, platform: string): string {
  try {
    if (platform === 'chatgpt') {
      // ChatGPT export: array of conversation objects
      const convs = Array.isArray(raw) ? raw : [raw];
      const parts: string[] = [];
      for (const conv of convs) {
        if (conv?.mapping) {
          for (const node of Object.values(conv.mapping) as any[]) {
            const content = node?.message?.content?.parts;
            if (Array.isArray(content)) {
              parts.push(content.filter((p: unknown) => typeof p === 'string').join(' '));
            }
          }
        } else if (conv?.messages) {
          for (const msg of conv.messages) {
            if (msg?.content) parts.push(String(msg.content));
          }
        }
      }
      return parts.join('\n').slice(0, 50000);
    }

    if (platform === 'claude') {
      // Claude export: array of chat objects with messages
      const convs = Array.isArray(raw) ? raw : [raw];
      const parts: string[] = [];
      for (const conv of convs) {
        if (Array.isArray(conv?.chat_messages)) {
          for (const msg of conv.chat_messages) {
            if (msg?.text) parts.push(String(msg.text));
          }
        } else if (Array.isArray(conv?.messages)) {
          for (const msg of conv.messages) {
            if (msg?.content) parts.push(String(msg.content));
          }
        }
      }
      return parts.join('\n').slice(0, 50000);
    }

    if (platform === 'gemini') {
      const convs = Array.isArray(raw) ? raw : [raw];
      const parts: string[] = [];
      for (const conv of convs) {
        if (Array.isArray(conv?.messages)) {
          for (const msg of conv.messages) {
            if (msg?.content) parts.push(String(msg.content));
            if (msg?.text) parts.push(String(msg.text));
          }
        }
      }
      return parts.join('\n').slice(0, 50000);
    }

    // Generic fallback: stringify and trim
    return JSON.stringify(raw).slice(0, 50000);
  } catch {
    return typeof raw === 'string' ? raw.slice(0, 50000) : '';
  }
}

async function analyseWithAI(content: string): Promise<AnalysisResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyse these AI conversation excerpts and extract structured data:\n\n${content}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI analysis failed: ${res.status} ${err}`);
  }

  const json = await res.json();
  const text: string = json.content?.[0]?.text ?? '';

  // Extract JSON from response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned no valid JSON');

  return JSON.parse(match[0]) as AnalysisResult;
}

async function processZipFile(buffer: ArrayBuffer): Promise<{ text: string; platform: string }> {
  // Dynamic import for adm-zip or native unzip — fallback to treating as text
  try {
    // Try to read as text first (some "zip" uploads are actually JSON)
    const text = new TextDecoder().decode(buffer);
    if (text.trimStart().startsWith('{') || text.trimStart().startsWith('[')) {
      return { text: text.slice(0, 50000), platform: 'unknown' };
    }
  } catch {
    // Not text-readable
  }
  throw new Error('ZIP file processing requires server-side unzip support. Please upload the extracted JSON file directly.');
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminSupabaseClient();

  try {
    let conversationText = '';
    let platform = 'unknown';

    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      // File upload path
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided. Send a "file" field in multipart form data.' }, { status: 400 });
      }

      const filename = file.name.toLowerCase();
      const buffer = await file.arrayBuffer();

      if (filename.endsWith('.zip')) {
        const result = await processZipFile(buffer);
        conversationText = result.text;
        platform = result.platform;
      } else if (filename.endsWith('.json')) {
        const raw = new TextDecoder().decode(buffer);
        platform = detectPlatformFromFilename(file.name);

        try {
          const parsed = JSON.parse(raw);
          conversationText = extractTextFromConversations(parsed, platform);
        } catch {
          conversationText = raw.slice(0, 50000);
        }
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a .json or .zip file.' },
          { status: 400 }
        );
      }
    } else {
      // JSON body path: { text: string, platform: string }
      const body = await req.json();
      if (!body?.text || typeof body.text !== 'string') {
        return NextResponse.json(
          { error: 'Provide either a file upload or a JSON body with { text: string, platform: string }.' },
          { status: 400 }
        );
      }
      conversationText = body.text.slice(0, 50000);
      platform = typeof body.platform === 'string' ? body.platform : 'unknown';
    }

    if (!conversationText.trim()) {
      return NextResponse.json({ error: 'No conversation content found to analyse.' }, { status: 400 });
    }

    // Run AI analysis
    const analysis = await analyseWithAI(conversationText);
    if (!analysis) {
      return NextResponse.json({ error: 'AI service not configured. Set ANTHROPIC_API_KEY.' }, { status: 503 });
    }

    const now = new Date().toISOString();
    let tasksCreated = 0;
    let goalsCreated = 0;
    let memoriesAdded = 0;
    const categoryStats: Record<string, number> = {};

    // Insert into imported_conversations — one row per category with items
    const categoryEntries = Object.entries(analysis.categories) as [string, string[]][];
    const importRows = categoryEntries
      .filter(([, items]) => items.length > 0)
      .map(([category, items]) => ({
        user_id: user.id,
        platform,
        category,
        items,
        imported_at: now,
      }));

    if (importRows.length > 0) {
      const { error: importError } = await supabase
        .from('imported_conversations')
        .insert(importRows);
      if (importError) {
        console.error('[import/history] imported_conversations insert error:', importError.message);
      }
      for (const row of importRows) {
        categoryStats[row.category] = row.items.length;
      }
    }

    // Insert tasks
    if (analysis.tasks.length > 0) {
      const taskRows = analysis.tasks.map((title: string) => ({
        user_id: user.id,
        title: title.slice(0, 500),
        status: 'pending',
        source: 'import',
        created_at: now,
      }));
      const { error: taskError, data: insertedTasks } = await supabase
        .from('tasks')
        .insert(taskRows)
        .select('id');
      if (taskError) {
        console.error('[import/history] tasks insert error:', taskError.message);
      } else {
        tasksCreated = insertedTasks?.length ?? 0;
      }
    }

    // Insert goals
    if (analysis.goals.length > 0) {
      const goalRows = analysis.goals.map((title: string) => ({
        user_id: user.id,
        title: title.slice(0, 500),
        status: 'active',
        source: 'import',
        created_at: now,
      }));
      const { error: goalError, data: insertedGoals } = await supabase
        .from('goals')
        .insert(goalRows)
        .select('id');
      if (goalError) {
        console.error('[import/history] goals insert error:', goalError.message);
      } else {
        goalsCreated = insertedGoals?.length ?? 0;
      }
    }

    // Insert key facts into memories
    if (analysis.keyFacts.length > 0) {
      const memoryRows = analysis.keyFacts.map((fact: string) => ({
        user_id: user.id,
        content: fact.slice(0, 1000),
        source: 'import',
        created_at: now,
      }));
      const { error: memError, data: insertedMems } = await supabase
        .from('memories')
        .insert(memoryRows)
        .select('id');
      if (memError) {
        console.error('[import/history] memories insert error:', memError.message);
      } else {
        memoriesAdded = insertedMems?.length ?? 0;
      }
    }

    // Update user_autopilot_profile with recommended persona
    if (analysis.recommendedPersona) {
      const { error: profileError } = await supabase
        .from('user_autopilot_profile')
        .upsert(
          {
            user_id: user.id,
            persona: analysis.recommendedPersona,
            updated_at: now,
          },
          { onConflict: 'user_id' }
        );
      if (profileError) {
        console.error('[import/history] user_autopilot_profile upsert error:', profileError.message);
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        conversations: importRows.length,
        tasksCreated,
        goalsCreated,
        memoriesAdded,
        categories: categoryStats,
      },
      summary: analysis.summary,
      recommendedPersona: analysis.recommendedPersona,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[import/history] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
