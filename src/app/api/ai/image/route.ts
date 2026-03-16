import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) return NextResponse.json({ error: 'Image generation not configured. Add REPLICATE_API_TOKEN to environment variables.' }, { status: 503 });

  const { chatId, prompt } = await req.json();
  if (!chatId || !prompt?.trim()) {
    return NextResponse.json({ error: 'chatId and prompt required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  await supabase.from('chat_messages').insert({
    chat_id: chatId,
    user_id: user.id,
    role: 'user',
    content: prompt.trim(),
  });

  try {
    const response = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${apiKey}`,
          Prefer: 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt: prompt.trim(),
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'webp',
            output_quality: 90,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.detail || 'Image generation failed' }, { status: 500 });
    }

    const prediction = await response.json();

    if (prediction.status !== 'succeeded' || !prediction.output?.[0]) {
      return NextResponse.json({ error: 'Image generation did not complete in time' }, { status: 500 });
    }

    const imageUrl = prediction.output[0];
    const content = `![Generated image](${imageUrl})\n\n*${prompt.trim()}*`;

    const { data: msg } = await supabase
      .from('chat_messages')
      .insert({ chat_id: chatId, user_id: user.id, role: 'assistant', content })
      .select()
      .single();

    await supabase
      .from('chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', chatId)
      .eq('user_id', user.id);

    const { data: u } = await supabase
      .from('usage_counters')
      .select('ai_requests_used')
      .eq('user_id', user.id)
      .single();
    if (u) {
      await supabase
        .from('usage_counters')
        .update({ ai_requests_used: (u.ai_requests_used || 0) + 1 })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ message: msg, imageUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Image generation failed' }, { status: 500 });
  }
}
