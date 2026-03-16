import { NextRequest, NextResponse } from 'next/server';
import { getUser, getProfile } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (profile?.plan_tier !== 'pro') {
    return NextResponse.json({ error: 'Vercel deployment requires Pro plan' }, { status: 403 });
  }

  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return NextResponse.json(
      { error: 'VERCEL_TOKEN not configured. Add your Vercel token to enable one-click deployments.' },
      { status: 503 }
    );
  }

  const { files, projectName, language } = await req.json();
  if (!files?.length) return NextResponse.json({ error: 'No files to deploy' }, { status: 400 });

  const slug = (projectName || 'omnia-project')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);

  // Build deployment files — for React, wrap in a static HTML page
  const deployFiles: Array<{ file: string; data: string; encoding: string }> = [];

  if (language === 'react') {
    // Find the JSX content and wrap in a standalone HTML page
    const jsx = files.find((f: any) => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'))?.content || '';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName || 'My React App'}</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>body{margin:0;font-family:system-ui,-apple-system,sans-serif}</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
${jsx}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
  </script>
</body>
</html>`;
    deployFiles.push({
      file: 'index.html',
      data: Buffer.from(html).toString('base64'),
      encoding: 'base64',
    });
  } else {
    for (const f of files as Array<{ name: string; content: string }>) {
      deployFiles.push({
        file: f.name,
        data: Buffer.from(f.content).toString('base64'),
        encoding: 'base64',
      });
    }
  }

  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: slug,
      files: deployFiles,
      projectSettings: { framework: null },
      target: 'production',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Unknown error' } }));
    return NextResponse.json(
      { error: err?.error?.message || 'Vercel deployment failed' },
      { status: 500 }
    );
  }

  const data = await res.json();
  const url = data.url ? `https://${data.url}` : null;

  return NextResponse.json({ url, deploymentId: data.id, state: data.readyState });
}
