import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString();

  // Count feature activity from the last 24h
  const [
    { count: taskCount },
    { count: noteCount },
    { count: chatCount },
    { count: invoiceCount },
    { count: exportCount },
    { count: contentCount },
  ] = await Promise.all([
    s.from('tasks').select('*', { count: 'exact', head: true }).gte('updated_at', yesterday),
    s.from('notes').select('*', { count: 'exact', head: true }).gte('updated_at', yesterday),
    s.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', yesterday),
    s.from('invoices').select('*', { count: 'exact', head: true }).gte('updated_at', yesterday),
    s.from('exports').select('*', { count: 'exact', head: true }).gte('created_at', yesterday),
    s.from('content_items').select('*', { count: 'exact', head: true }).gte('created_at', yesterday),
  ]);

  const features = [
    { feature_name: 'tasks', event_count: taskCount ?? 0 },
    { feature_name: 'notes', event_count: noteCount ?? 0 },
    { feature_name: 'ai_chat', event_count: chatCount ?? 0 },
    { feature_name: 'invoices', event_count: invoiceCount ?? 0 },
    { feature_name: 'exports', event_count: exportCount ?? 0 },
    { feature_name: 'content_studio', event_count: contentCount ?? 0 },
  ];

  for (const f of features) {
    await s.from('feature_analytics').upsert({
      feature_name: f.feature_name,
      event_count: f.event_count,
      recorded_date: today,
    }, { onConflict: 'feature_name,recorded_date' });
  }

  return NextResponse.json({ recorded: features.length, date: today });
}
