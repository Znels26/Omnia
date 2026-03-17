import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const QUESTIONS = [
  'What do you do for work or what are you trying to achieve?',
  'Who are your main clients or who do you want to reach?',
  'What are your top 3 goals right now?',
  'What does a perfect week look like for you?',
  'What tasks do you hate doing most?',
  'What time do you wake up?',
  'What platforms do you use daily?',
  'How do you prefer to be contacted?',
  'What decisions can Omnia make without asking you?',
  'What should Omnia never do without your permission?',
];

function detectPersona(answers: Record<string, unknown>): string {
  const text = Object.values(answers).join(' ').toLowerCase();
  if (/freelance|money|income|earn|revenue|client|invoice/.test(text)) return 'hustler';
  if (/fitness|health|workout|gym|nutrition|calories|weight/.test(text)) return 'optimiser';
  if (/saving|budget|debt|frugal|spend|invest|financial freedom/.test(text)) return 'builder';
  if (/content|social|post|creator|youtube|instagram|tiktok|followers/.test(text)) return 'creator';
  if (/learning|study|course|skill|read|book|education/.test(text)) return 'learner';
  if (/business|clients|team|agency|operations|staff|manage/.test(text)) return 'operator';
  return 'starter';
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  try {
    const body = await req.json();
    const { answers, step } = body as { answers: Record<string, unknown>; step: number };

    if (typeof step !== 'number' || step < 1 || step > 10) {
      return NextResponse.json({ error: 'step must be a number between 1 and 10' }, { status: 400 });
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers must be an object' }, { status: 400 });
    }

    // Final step — save profile and return persona
    if (step === 10) {
      const supabase = createAdminSupabaseClient();
      const persona = detectPersona(answers);

      const { error } = await supabase
        .from('user_autopilot_profile')
        .upsert(
          {
            user_id: user.id,
            onboarding_answers: answers,
            onboarding_complete: true,
            persona,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ done: true, persona });
    }

    // Steps 1-9 — generate acknowledgement + transition
    const currentAnswer = answers[`step_${step}`] ?? answers[step] ?? Object.values(answers).at(-1) ?? '';
    const nextQuestion = QUESTIONS[step]; // step is 1-indexed, array is 0-indexed so this gives step+1

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system:
          'You are Omnia, an intelligent AI assistant. The user is setting up their Autopilot profile. Respond warmly and briefly (1-2 sentences) acknowledging their answer, then naturally transition to the next question. Be conversational, encouraging, and smart. Don\'t be generic.',
        messages: [
          {
            role: 'user',
            content: `My answer to "${QUESTIONS[step - 1]}" is: ${currentAnswer}\n\nNext question to transition to: "${nextQuestion}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || 'AI error' }, { status: 502 });
    }

    const data = await response.json();
    const reply: string = data.content?.[0]?.text ?? '';

    return NextResponse.json({ reply, nextQuestion });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
