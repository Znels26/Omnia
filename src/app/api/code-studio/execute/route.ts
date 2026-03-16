import { NextRequest, NextResponse } from 'next/server';
import { getUser, getProfile } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (profile?.plan_tier !== 'pro') {
    return NextResponse.json({ error: 'Code execution requires Pro plan' }, { status: 403 });
  }

  const e2bKey = process.env.E2B_API_KEY;
  if (!e2bKey) {
    return NextResponse.json({
      stdout: '',
      stderr: 'E2B_API_KEY not configured. Add your E2B API key to run Python and Node.js code.',
      error: true,
    });
  }

  const { code, language } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  try {
    const { CodeInterpreter } = await import('@e2b/code-interpreter');

    if (language === 'python') {
      const sandbox = await CodeInterpreter.create({ apiKey: e2bKey });
      try {
        const execution = await sandbox.notebook.execCell(code);
        await sandbox.close();
        const stdout = execution.logs.stdout.join('\n');
        const stderr = execution.logs.stderr.join('\n');
        const outputs = execution.results
          .map((r: any) => r.text || r.html || r.png || '')
          .filter(Boolean)
          .join('\n');
        return NextResponse.json({
          stdout: [stdout, outputs].filter(Boolean).join('\n'),
          stderr,
          error: !!execution.error,
          errorMessage: execution.error?.value,
        });
      } catch (err) {
        await sandbox.close();
        throw err;
      }
    }

    if (language === 'nodejs') {
      const { Sandbox } = await import('@e2b/code-interpreter');
      const sandbox = await (Sandbox as any).create({ apiKey: e2bKey });
      try {
        await sandbox.files.write('index.js', code);
        const proc = await sandbox.process.start({ cmd: 'node index.js' });
        await proc.wait();
        await sandbox.close();
        return NextResponse.json({
          stdout: proc.output.stdout,
          stderr: proc.output.stderr,
          error: proc.exitCode !== 0,
        });
      } catch (err) {
        await sandbox.close();
        throw err;
      }
    }

    return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({
      stdout: '',
      stderr: err?.message || 'Execution failed',
      error: true,
    });
  }
}
