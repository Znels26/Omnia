import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Image generation not configured. Add HUGGINGFACE_API_KEY to environment variables.' }, { status: 503 });

  const { chatId, prompt } = await req.json();
  if (!chatId || !prompt?.trim()) return NextResponse.json({ error: 'chatId and prompt required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();

  try {
    const hfRes = await fetch(
      'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt.trim() }),
      }
    );

    if (!hfRes.ok) {
      let errMsg = 'Image generation failed';
      try {
        const err = await hfRes.json();
        errMsg = err.error || errMsg;
        if (errMsg.toLowerCase().includes('loading')) errMsg = 'Model is warming up — please try again in 20 seconds';
      } catch {}
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    const imageBuffer = await hfRes.arrayBuffer();
    const contentType = hfRes.headers.get('content-type') || 'image/jpeg';

    // Try Supabase Storage first, fall back to base64
    let imageUrl: string;
    await supabase.storage.createBucket('generated-images', { public: true }).catch(() => {});
    const fileName = `${user.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, imageBuffer, { contentType, upsert: false });

    if (uploadError) {
      const base64 = Buffer.from(imageBuffer).toString('base64');
      imageUrl = `data:${contentType};base64,${base64}`;
    } else {
      const { data: { publicUrl } } = supabase.storage.from('generated-images').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const content = `![Generated image](${imageUrl})\n\n*${prompt.trim()}*`;

    // Insert user message first to preserve chronological order, then assistant message
    const { data: userMsg } = await supabase.from('chat_messages')
      .insert({ chat_id: chatId, user_id: user.id, role: 'user', content: prompt.trim() })
      .select().single();

    const [{ data: assistantMsg }] = await Promise.all([
      supabase.from('chat_messages').insert({ chat_id: chatId, user_id: user.id, role: 'assistant', content }).select().single(),
      supabase.from('chats').update({ last_message_at: new Date().toISOString() }).eq('id', chatId).eq('user_id', user.id),
    ]);

    // Always return imageUrl so the client can display even if DB insert fails
    return NextResponse.json({ message: assistantMsg || null, userMessage: userMsg || null, imageUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Image generation failed' }, { status: 500 });
  }
}
