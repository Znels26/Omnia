import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET — list files for a project
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();

  // Verify ownership
  const { data: project } = await supabase
    .from('code_projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('code_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ files: data ?? [] });
}

// POST — create or bulk-upsert files for a project
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { project_id, files } = body as {
    project_id: string;
    files: Array<{ name: string; content: string; language?: string }>;
  };

  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  if (!files?.length) return NextResponse.json({ error: 'files required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();

  // Verify ownership
  const { data: project } = await supabase
    .from('code_projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Upsert all files
  const rows = files.map(f => ({
    project_id,
    name: f.name,
    content: f.content,
    language: f.language ?? inferLanguage(f.name),
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('code_files')
    .upsert(rows, { onConflict: 'project_id,name' })
    .select('*');

  // Update project updated_at
  await supabase
    .from('code_projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', project_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ files: data });
}

// PATCH — update a single file's content
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, content, name } = body as { id: string; content?: string; name?: string };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();

  // Verify ownership through project join
  const { data: file } = await supabase
    .from('code_files')
    .select('id, project_id, code_projects!inner(user_id)')
    .eq('id', id)
    .single();

  if (!file || (file as any).code_projects?.user_id !== user.id) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (content !== undefined) updates.content = content;
  if (name !== undefined) { updates.name = name; updates.language = inferLanguage(name); }

  const { data, error } = await supabase
    .from('code_files')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ file: data });
}

// DELETE — remove a file
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();

  // Verify ownership through project join
  const { data: file } = await supabase
    .from('code_files')
    .select('id, project_id, code_projects!inner(user_id)')
    .eq('id', id)
    .single();

  if (!file || (file as any).code_projects?.user_id !== user.id) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const { error } = await supabase.from('code_files').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

function inferLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    html: 'html', css: 'css', js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript', py: 'python', json: 'json',
    md: 'markdown', mdx: 'markdown', txt: 'plaintext', sh: 'shell',
  };
  return map[ext] ?? 'plaintext';
}
