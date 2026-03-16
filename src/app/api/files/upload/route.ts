import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST(req: NextRequest) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  const s = createAdminSupabaseClient();
  const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
  const storagePath = `files/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const ab = await file.arrayBuffer();
  const { error: uploadError } = await s.storage.from('omnia-files').upload(storagePath, ab, { contentType: file.type, upsert: false });
  if (uploadError) {
    // Storage bucket may not exist yet - still create the record
    const { data: fileRecord, error: dbError } = await s.from('files').insert({ user_id: user.id, name: file.name, original_name: file.name, file_type: fileType, mime_type: file.type, size_bytes: file.size, storage_path: storagePath, storage_url: null, processing_status: 'ready' }).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ file: fileRecord }, { status: 201 });
  }
  const { data: urlData } = s.storage.from('omnia-files').getPublicUrl(storagePath);
  const { data: fileRecord, error: dbError } = await s.from('files').insert({ user_id: user.id, name: file.name, original_name: file.name, file_type: fileType, mime_type: file.type, size_bytes: file.size, storage_path: storagePath, storage_url: urlData.publicUrl, processing_status: 'ready' }).select().single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  const { data: u } = await s.from('usage_counters').select('files_count').eq('user_id', user.id).single();
  if (u) await s.from('usage_counters').update({ files_count: (u.files_count || 0) + 1 }).eq('user_id', user.id);
  return NextResponse.json({ file: fileRecord }, { status: 201 });
}
