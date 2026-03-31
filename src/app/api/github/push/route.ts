import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface PushFile {
  name: string;
  content: string;
}

async function githubFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { files, repoName, description }: { files: PushFile[]; repoName: string; description?: string } = await req.json();
  if (!files?.length || !repoName) {
    return NextResponse.json({ error: 'files and repoName are required' }, { status: 400 });
  }

  // Slug-ify the repo name
  const slug = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'my-project';

  // Fetch the user's GitHub token from their profile
  const s = createAdminSupabaseClient();
  const { data: profile } = await s.from('profiles').select('github_token').eq('id', user.id).single();

  if (!profile?.github_token) {
    return NextResponse.json({ error: 'No GitHub token. Connect GitHub in Settings first.' }, { status: 422 });
  }

  const token = profile.github_token;

  // Get authenticated user's login
  const meRes = await githubFetch('/user', token);
  if (!meRes.ok) {
    return NextResponse.json({ error: 'GitHub token invalid or expired.' }, { status: 401 });
  }
  const me = await meRes.json();
  const owner = me.login as string;

  // Check if repo exists
  const repoCheckRes = await githubFetch(`/repos/${owner}/${slug}`, token);
  let repoUrl: string;

  if (repoCheckRes.status === 404) {
    // Create repo
    const createRes = await githubFetch('/user/repos', token, {
      method: 'POST',
      body: JSON.stringify({
        name: slug,
        description: description || 'Created with Omnia Code Studio',
        private: false,
        auto_init: false,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json();
      return NextResponse.json({ error: err.message || 'Failed to create repo' }, { status: 500 });
    }
    const repo = await createRes.json();
    repoUrl = repo.html_url;
  } else if (repoCheckRes.ok) {
    const repo = await repoCheckRes.json();
    repoUrl = repo.html_url;
  } else {
    return NextResponse.json({ error: 'Failed to check repo status' }, { status: 500 });
  }

  // Push each file via the Contents API
  const errors: string[] = [];
  for (const file of files) {
    const filePath = file.name.startsWith('/') ? file.name.slice(1) : file.name;
    const contentB64 = Buffer.from(file.content, 'utf8').toString('base64');

    // Check if file exists to get its SHA (needed for updates)
    let sha: string | undefined;
    const existsRes = await githubFetch(`/repos/${owner}/${slug}/contents/${filePath}`, token);
    if (existsRes.ok) {
      const existing = await existsRes.json();
      sha = existing.sha;
    }

    const putRes = await githubFetch(`/repos/${owner}/${slug}/contents/${filePath}`, token, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Update ${filePath} via Omnia Code Studio`,
        content: contentB64,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      errors.push(`${filePath}: ${err.message || 'unknown error'}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ repoUrl, partialErrors: errors }, { status: 207 });
  }

  return NextResponse.json({ repoUrl });
}
