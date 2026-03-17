'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Play, Sparkles, Plus, Trash2, Copy, X, Loader2,
  Globe, Terminal, FileCode, Crown, ArrowRight, Eye,
  ChevronDown, Upload, Check, Code2, RefreshCw, PanelLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e', height: '100%' }}>
      <Loader2 size={20} color="hsl(240 5% 40%)" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  ),
});

type Lang = 'html' | 'react' | 'python' | 'nodejs';
type OutputTab = 'preview' | 'console';
type MobilePanel = 'files' | 'editor' | 'output';

interface ProjectFile {
  id: string;
  name: string;
  content: string;
}

const DEFAULT_FILES: Record<Lang, ProjectFile[]> = {
  html: [
    {
      id: 'html-1', name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
</head>
<body>
  <div class="container">
    <h1>Hello, World! 👋</h1>
    <p>Edit the files to get started.</p>
    <button id="btn">Click me</button>
    <p id="output"></p>
  </div>
</body>
</html>`,
    },
    {
      id: 'html-2', name: 'style.css',
      content: `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  padding: 40px;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p { color: #94a3b8; margin-bottom: 24px; font-size: 1.1rem; }

button {
  padding: 12px 28px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover { background: #2563eb; }
#output { margin-top: 16px; color: #4ade80; font-weight: 600; }`,
    },
    {
      id: 'html-3', name: 'script.js',
      content: `const btn = document.getElementById('btn');
const output = document.getElementById('output');
let count = 0;

btn.addEventListener('click', () => {
  count++;
  output.textContent = \`Button clicked \${count} time\${count !== 1 ? 's' : ''}!\`;
});`,
    },
  ],
  react: [
    {
      id: 'react-1', name: 'App.jsx',
      content: `function App() {
  const [count, setCount] = React.useState(0);
  const [todos, setTodos] = React.useState(['Buy groceries', 'Build something cool']);
  const [input, setInput] = React.useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input.trim()]);
      setInput('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          React App ⚛️
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Edit App.jsx to get started</p>

        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginBottom: '12px' }}>Counter: <strong style={{ color: '#38bdf8', fontSize: '1.5rem' }}>{count}</strong></p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setCount(c => c - 1)} style={{ padding: '8px 20px', background: '#334155', border: 'none', borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer', fontSize: '18px' }}>−</button>
            <button onClick={() => setCount(c => c + 1)} style={{ padding: '8px 20px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '18px' }}>+</button>
          </div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#94a3b8' }}>TO-DO LIST</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder="Add a task..." style={{ flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none' }} />
            <button onClick={addTodo} style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Add</button>
          </div>
          {todos.map((todo, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', color: '#cbd5e1', flex: 1 }}>{todo}</span>
              <button onClick={() => setTodos(todos.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
    },
  ],
  python: [
    {
      id: 'py-1', name: 'main.py',
      content: `# Python 3 — runs in a secure E2B sandbox
import math
import random

def fibonacci(n):
    """Generate first n Fibonacci numbers."""
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib[:n]

def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True

print("=== Python Code Studio ===\\n")
fibs = fibonacci(10)
print(f"First 10 Fibonacci numbers: {fibs}")
primes = [x for x in range(2, 50) if is_prime(x)]
print(f"Primes under 50: {primes}")
print(f"\\nRandom number: {random.randint(1, 100)}")
print("\\nEdit main.py and press Run to execute!")`,
    },
  ],
  nodejs: [
    {
      id: 'node-1', name: 'index.js',
      content: `// Node.js — runs in a secure E2B sandbox
const os = require('os');

function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) { yield a; [a, b] = [b, a + b]; }
}

console.log('=== Node.js Code Studio ===\\n');
console.log(\`Platform: \${os.platform()} (\${os.arch()})\`);
console.log(\`Node version: \${process.version}\\n\`);

const gen = fibonacci();
const fibs = Array.from({ length: 10 }, () => gen.next().value);
console.log('First 10 Fibonacci numbers:', fibs);

async function main() {
  const data = await new Promise(resolve =>
    setTimeout(() => resolve({ status: 'success', items: [1, 2, 3] }), 100)
  );
  console.log('\\nAsync result:', JSON.stringify(data));
  console.log('\\nEdit index.js and press Run!');
}
main();`,
    },
  ],
};

function getMonacoLang(filename: string): string {
  const ext = filename.split('.').pop() || '';
  const map: Record<string, string> = {
    html: 'html', css: 'css', js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript', py: 'python', json: 'json', md: 'markdown',
  };
  return map[ext] || 'plaintext';
}

function buildPreviewSrcdoc(files: ProjectFile[], lang: Lang): string {
  if (lang === 'html') {
    const html = files.find(f => f.name.endsWith('.html'))?.content || '<html><body></body></html>';
    const css = files.filter(f => f.name.endsWith('.css')).map(f => f.content).join('\n');
    const js = files.filter(f => f.name.endsWith('.js')).map(f => f.content).join('\n');
    const withCss = css ? html.replace('</head>', `<style>\n${css}\n</style>\n</head>`) : html;
    return js ? withCss.replace('</body>', `<script>\n${js}\n</script>\n</body>`) : withCss;
  }
  if (lang === 'react') {
    const jsx = files.find(f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx'))?.content || '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>*, *::before, *::after { box-sizing: border-box; } body { margin: 0; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
${jsx}
try {
  const rootEl = document.getElementById('root');
  if (typeof App !== 'undefined') {
    ReactDOM.createRoot(rootEl).render(React.createElement(App));
  } else {
    rootEl.innerHTML = '<p style="padding:20px;color:#f87171">No App component found.</p>';
  }
} catch(e) {
  document.getElementById('root').innerHTML = '<pre style="padding:20px;color:#f87171;font-size:12px">' + e.message + '</pre>';
}
  </script>
</body>
</html>`;
  }
  return '';
}

const LANG_OPTIONS: { id: Lang; label: string; emoji: string; desc: string }[] = [
  { id: 'html',   label: 'HTML / CSS / JS', emoji: '🌐', desc: 'Static web pages' },
  { id: 'react',  label: 'React',           emoji: '⚛️', desc: 'Component UI'    },
  { id: 'python', label: 'Python',          emoji: '🐍', desc: 'Scripts & data'  },
  { id: 'nodejs', label: 'Node.js',         emoji: '🟩', desc: 'Server scripts'  },
];

export function CodeStudioView({ profile }: { profile: any }) {
  const isPro = profile?.plan_tier === 'pro';

  const [lang, setLang] = useState<Lang>('html');
  const [files, setFiles] = useState<ProjectFile[]>(DEFAULT_FILES.html);
  const [activeFileId, setActiveFileId] = useState('html-1');
  const [outputTab, setOutputTab] = useState<OutputTab>('preview');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('editor');
  const [isMobile, setIsMobile] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [previewSrc, setPreviewSrc] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projectName, setProjectName] = useState('my-project');

  const previewDebounce = useRef<NodeJS.Timeout>();
  const langBtnRef = useRef<HTMLDivElement>(null);
  const [langBtnRect, setLangBtnRect] = useState<{ left: number; top: number }>({ left: 0, top: 50 });
  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Deep-link: /code-studio?prompt=... auto-opens AI panel with pre-filled prompt
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPrompt = params.get('prompt');
    if (urlPrompt) {
      setAiPrompt(decodeURIComponent(urlPrompt));
      setShowAI(true);
    }
  }, []);

  // Live preview for HTML/React
  useEffect(() => {
    if (lang !== 'html' && lang !== 'react') return;
    clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(() => {
      setPreviewSrc(buildPreviewSrcdoc(files, lang));
    }, 600);
    return () => clearTimeout(previewDebounce.current);
  }, [files, lang]);

  // Auto-set output tab per language
  useEffect(() => {
    setOutputTab(lang === 'python' || lang === 'nodejs' ? 'console' : 'preview');
  }, [lang]);

  function switchLang(newLang: Lang) {
    setLang(newLang);
    const preset = DEFAULT_FILES[newLang];
    setFiles(preset);
    setActiveFileId(preset[0].id);
    setConsoleOutput('');
    setDeployUrl('');
    setShowLangPicker(false);
  }

  function updateActiveFile(content: string) {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f));
  }

  function addFile() {
    const name = newFileName.trim();
    if (!name) return;
    const id = `file-${Date.now()}`;
    setFiles(prev => [...prev, { id, name, content: '' }]);
    setActiveFileId(id);
    setNewFileName('');
    setShowNewFile(false);
  }

  function deleteFile(id: string) {
    if (files.length === 1) return toast.error('Cannot delete the last file');
    const remaining = files.filter(f => f.id !== id);
    setFiles(remaining);
    if (activeFileId === id) setActiveFileId(remaining[0].id);
  }

  async function runCode() {
    if (!isPro) return toast.error('Code execution requires Pro plan');
    if (lang !== 'python' && lang !== 'nodejs') return;
    setRunning(true);
    setOutputTab('console');
    if (isMobile) setMobilePanel('output');
    setConsoleOutput('Running…\n');
    try {
      const code = files.find(f => f.name === (lang === 'python' ? 'main.py' : 'index.js'))?.content
        || activeFile.content;
      const res = await fetch('/api/code-studio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: lang }),
      });
      const data = await res.json();
      setConsoleOutput(!res.ok ? `Error: ${data.error}` : ([data.stdout, data.stderr].filter(Boolean).join('\n') || '(no output)'));
    } catch (err: any) {
      setConsoleOutput(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  }

  async function deployToVercel() {
    if (!isPro) return toast.error('Deployment requires Pro plan');
    setDeploying(true);
    try {
      const res = await fetch('/api/code-studio/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: files.map(f => ({ name: f.name, content: f.content })), projectName, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || 'Deployment failed');
      else if (data.url) { setDeployUrl(data.url); toast.success('Deployed!'); }
    } catch (err: any) {
      toast.error(err.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  }

  async function generateWithAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const res = await fetch('/api/ai/code-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, language: lang, files: files.map(f => ({ name: f.name, content: f.content })) }),
      });
      if (!res.ok) throw new Error('AI request failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try { const { text } = JSON.parse(line.slice(6)); fullText += text; setAiResponse(fullText); } catch {}
          }
        }
      }

      const fileRegex = /===\s*([^\n=]+)\s*===\n([\s\S]*?)===END===/g;
      let match;
      let updated = false;
      const newFiles = [...files];
      while ((match = fileRegex.exec(fullText)) !== null) {
        const [, fname, content] = match;
        const trimmedName = fname.trim();
        const trimmedContent = content.trim();
        const existing = newFiles.findIndex(f => f.name === trimmedName);
        if (existing >= 0) newFiles[existing] = { ...newFiles[existing], content: trimmedContent };
        else newFiles.push({ id: `ai-${Date.now()}-${trimmedName}`, name: trimmedName, content: trimmedContent });
        updated = true;
      }
      if (updated) { setFiles(newFiles); toast.success('Files updated by AI'); if (isMobile) setMobilePanel('editor'); }
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(activeFile?.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canRun = lang === 'python' || lang === 'nodejs';
  const canPreview = lang === 'html' || lang === 'react';
  const currentLang = LANG_OPTIONS.find(l => l.id === lang)!;

  // ── Pro gate ──
  if (!isPro) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'hsl(262 83% 58% / 0.15)', border: '1px solid hsl(262 83% 58% / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Code2 size={28} color="hsl(262,83%,75%)" />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '999px', background: 'hsl(262 83% 58% / 0.1)', border: '1px solid hsl(262 83% 58% / 0.2)', marginBottom: '16px' }}>
            <Crown size={11} color="hsl(262,83%,75%)" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(262,83%,75%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pro Feature</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Code Studio</h1>
          <p style={{ fontSize: '15px', color: 'hsl(240 5% 55%)', lineHeight: 1.65, marginBottom: '28px' }}>
            A full in-browser IDE with Monaco editor, live preview, AI code generation, Python &amp; Node.js execution via E2B, and one-click Vercel deployment.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto 28px', textAlign: 'left' }}>
            {['Monaco editor (VS Code in the browser)', 'Live HTML, CSS, JS & React preview', 'AI code generation with Claude', 'Python & Node.js execution (E2B)', 'One-click Vercel deployment', 'Multi-file project tree'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'hsl(262 83% 58% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={10} color="hsl(262,83%,75%)" />
                </div>
                <span style={{ fontSize: '13.5px', color: 'hsl(240 5% 70%)' }}>{item}</span>
              </div>
            ))}
          </div>
          <Link href="/billing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', background: 'hsl(262 83% 58%)', color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Upgrade to Pro <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Shared panel pieces ──
  const fileTreePanel = (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'hsl(240 6% 5%)', flex: isMobile ? 1 : undefined, width: isMobile ? undefined : '188px', flexShrink: 0, borderRight: isMobile ? 'none' : '1px solid hsl(240 6% 14%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid hsl(240 6% 12%)' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 40%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Files</span>
        <button onClick={() => setShowNewFile(v => !v)} title="New file" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', padding: '4px' }}>
          <Plus size={15} />
        </button>
      </div>
      {showNewFile && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid hsl(240 6% 12%)' }}>
          <input
            autoFocus
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addFile(); if (e.key === 'Escape') setShowNewFile(false); }}
            placeholder="filename.ext"
            style={{ width: '100%', background: 'hsl(240 6% 10%)', border: '1px solid hsl(205 90% 48% / 0.4)', borderRadius: '6px', color: 'hsl(0 0% 88%)', fontSize: '13px', padding: '7px 10px', outline: 'none' }}
          />
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {files.map(file => (
          <div
            key={file.id}
            onClick={() => { setActiveFileId(file.id); if (isMobile) setMobilePanel('editor'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '12px 10px' : '7px 8px', borderRadius: '8px', cursor: 'pointer', background: activeFileId === file.id ? 'hsl(205 90% 48% / 0.1)' : 'transparent', color: activeFileId === file.id ? 'hsl(205,90%,70%)' : 'hsl(240 5% 60%)', fontSize: '13px', userSelect: 'none' }}
          >
            <FileCode size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            {files.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); deleteFile(file.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 38%)', display: 'flex', padding: '4px', flexShrink: 0 }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const editorPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      {/* File tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid hsl(240 6% 14%)', background: 'hsl(240 6% 6%)', overflowX: 'auto', flexShrink: 0 }}>
        {files.map(file => (
          <button
            key={file.id}
            onClick={() => setActiveFileId(file.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'none', border: 'none', borderBottom: activeFileId === file.id ? '2px solid hsl(205,90%,48%)' : '2px solid transparent', color: activeFileId === file.id ? 'hsl(0 0% 88%)' : 'hsl(240 5% 50%)', fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}
          >
            <FileCode size={11} />
            {file.name}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MonacoEditor
          height="100%"
          language={getMonacoLang(activeFile?.name || 'index.html')}
          value={activeFile?.content || ''}
          onChange={v => updateActiveFile(v || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: isMobile ? 14 : 13,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            bracketPairColorization: { enabled: true },
            renderLineHighlight: 'gutter',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
            fontLigatures: !isMobile,
            // Touch-friendly scrolling
            scrollbar: { verticalScrollbarSize: isMobile ? 8 : 6, useShadows: false },
          }}
        />
      </div>
    </div>
  );

  const outputPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'hsl(240 6% 5%)', flex: isMobile ? 1 : undefined, width: isMobile ? undefined : '42%', flexShrink: 0, borderLeft: isMobile ? 'none' : '1px solid hsl(240 6% 14%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid hsl(240 6% 12%)', padding: '0 8px', gap: '4px', height: '38px', flexShrink: 0 }}>
        {canPreview && (
          <button
            onClick={() => setOutputTab('preview')}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', background: outputTab === 'preview' ? 'hsl(240 6% 12%)' : 'none', border: 'none', color: outputTab === 'preview' ? 'hsl(0 0% 88%)' : 'hsl(240 5% 50%)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <Eye size={13} /> Preview
          </button>
        )}
        <button
          onClick={() => setOutputTab('console')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', background: outputTab === 'console' ? 'hsl(240 6% 12%)' : 'none', border: 'none', color: outputTab === 'console' ? 'hsl(0 0% 88%)' : 'hsl(240 5% 50%)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        >
          <Terminal size={13} /> Console
        </button>
        {outputTab === 'preview' && (
          <button onClick={() => setPreviewSrc(buildPreviewSrcdoc(files, lang))} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', display: 'flex', padding: '5px' }} title="Refresh">
            <RefreshCw size={13} />
          </button>
        )}
        {outputTab === 'console' && consoleOutput && (
          <button onClick={() => setConsoleOutput('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', display: 'flex', padding: '5px' }} title="Clear">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {outputTab === 'preview' && (
          previewSrc
            ? <iframe srcDoc={previewSrc} sandbox="allow-scripts allow-same-origin" style={{ width: '100%', height: '100%', border: 'none', background: 'white' }} title="Live preview" />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(240 5% 40%)', fontSize: '13px', textAlign: 'center' }}><div><Eye size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.25 }} /><p>Preview loading…</p></div></div>
        )}
        {outputTab === 'console' && (
          <div style={{ padding: '12px', height: '100%', overflowY: 'auto', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '13px', lineHeight: 1.7, color: 'hsl(142,70%,60%)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {consoleOutput || <span style={{ color: 'hsl(240 5% 38%)' }}>{canRun ? '▶ Press Run to execute your code' : 'Console output will appear here'}</span>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'hsl(240 10% 4%)' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', height: '50px', borderBottom: '1px solid hsl(240 6% 14%)', flexShrink: 0, overflowX: 'auto' }}>

        {/* Project name — hidden on mobile to save space */}
        {!isMobile && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <Code2 size={16} color="hsl(262,83%,75%)" />
              <input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'hsl(0 0% 88%)', fontSize: '14px', fontWeight: 600, outline: 'none', width: '120px' }}
              />
            </div>
            <div style={{ width: '1px', height: '22px', background: 'hsl(240 6% 18%)', flexShrink: 0 }} />
          </>
        )}

        {/* Language picker */}
        <div ref={langBtnRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => {
              if (langBtnRef.current) {
                const r = langBtnRef.current.getBoundingClientRect();
                setLangBtnRect({ left: r.left, top: r.bottom + 6 });
              }
              setShowLangPicker(v => !v);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'hsl(240 6% 11%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '8px', color: 'hsl(0 0% 85%)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <span>{currentLang.emoji}</span>
            {!isMobile && <span>{currentLang.label}</span>}
            <ChevronDown size={11} />
          </button>
          {showLangPicker && (
            <div style={{ position: 'fixed', top: langBtnRect.top, left: langBtnRect.left, zIndex: 9999, background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '10px', padding: '6px', minWidth: '180px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => switchLang(opt.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 10px', borderRadius: '7px', background: lang === opt.id ? 'hsl(240 6% 14%)' : 'none', border: 'none', color: lang === opt.id ? 'hsl(0 0% 90%)' : 'hsl(240 5% 65%)', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '16px' }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>{opt.desc}</div>
                  </div>
                  {lang === opt.id && <Check size={13} style={{ marginLeft: 'auto' }} color="hsl(205,90%,60%)" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Copy */}
        <button onClick={copyCode} title="Copy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: 'hsl(240 6% 11%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '8px', color: copied ? 'hsl(142,70%,55%)' : 'hsl(240 5% 60%)', cursor: 'pointer', flexShrink: 0 }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>

        {/* AI Generate */}
        <button
          onClick={() => setShowAI(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: showAI ? 'hsl(262 83% 58% / 0.2)' : 'hsl(262 83% 58% / 0.1)', border: `1px solid ${showAI ? 'hsl(262 83% 58% / 0.5)' : 'hsl(262 83% 58% / 0.25)'}`, borderRadius: '8px', color: 'hsl(262,83%,75%)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          <Sparkles size={13} />
          {!isMobile && <span>AI</span>}
        </button>

        {/* Run */}
        {canRun && (
          <button
            onClick={runCode}
            disabled={running}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: 'hsl(142 70% 40% / 0.15)', border: '1px solid hsl(142 70% 40% / 0.3)', borderRadius: '8px', color: 'hsl(142,70%,55%)', fontSize: '13px', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1, flexShrink: 0 }}
          >
            {running ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={13} />}
            {!isMobile && <span>{running ? 'Running…' : 'Run'}</span>}
          </button>
        )}

        {/* Deploy */}
        <button
          onClick={deployToVercel}
          disabled={deploying}
          title="Deploy to Vercel"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', background: 'hsl(205 90% 48% / 0.12)', border: '1px solid hsl(205 90% 48% / 0.3)', borderRadius: '8px', color: 'hsl(205,90%,60%)', fontSize: '13px', fontWeight: 600, cursor: deploying ? 'not-allowed' : 'pointer', opacity: deploying ? 0.6 : 1, flexShrink: 0 }}
        >
          {deploying ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={13} />}
          {!isMobile && <Upload size={13} />}
        </button>
      </div>

      {/* ── AI Panel ── */}
      {showAI && (
        <div style={{ borderBottom: '1px solid hsl(240 6% 14%)', padding: '10px 12px', background: 'hsl(240 6% 6%)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Sparkles size={14} color="hsl(262,83%,75%)" style={{ marginTop: '9px', flexShrink: 0 }} />
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generateWithAI(); }}
              placeholder='Describe what to build or change… e.g. "Add a dark mode toggle"'
              rows={isMobile ? 3 : 2}
              style={{ flex: 1, background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '8px', color: 'hsl(0 0% 88%)', fontSize: '14px', padding: '8px 12px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
            <button
              onClick={generateWithAI}
              disabled={aiLoading || !aiPrompt.trim()}
              style={{ padding: '8px 14px', background: 'hsl(262 83% 58%)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: aiLoading || !aiPrompt.trim() ? 'not-allowed' : 'pointer', opacity: !aiPrompt.trim() ? 0.5 : 1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {aiLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
              {aiLoading ? '…' : 'Go'}
            </button>
          </div>
          {aiResponse && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'hsl(240 6% 8%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(240 5% 55%)', maxHeight: '100px', overflowY: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace' }}>
              {aiResponse}
            </div>
          )}
        </div>
      )}

      {/* Deploy URL banner */}
      {deployUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'hsl(142 70% 40% / 0.1)', borderBottom: '1px solid hsl(142 70% 40% / 0.2)', flexShrink: 0 }}>
          <Check size={13} color="hsl(142,70%,55%)" />
          <span style={{ fontSize: '13px', color: 'hsl(142,70%,60%)', fontWeight: 500 }}>Deployed!</span>
          <a href={deployUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'hsl(205,90%,60%)', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deployUrl}</a>
          <button onClick={() => setDeployUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Mobile panel tab switcher ── */}
      {isMobile && (
        <div style={{ display: 'flex', background: 'hsl(240 6% 6%)', borderBottom: '1px solid hsl(240 6% 14%)', flexShrink: 0 }}>
          {[
            { id: 'files' as MobilePanel, label: 'Files', icon: <PanelLeft size={14} /> },
            { id: 'editor' as MobilePanel, label: 'Editor', icon: <FileCode size={14} /> },
            { id: 'output' as MobilePanel, label: canPreview ? 'Preview' : 'Console', icon: canPreview ? <Eye size={14} /> : <Terminal size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobilePanel(tab.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', background: 'none', border: 'none', borderBottom: mobilePanel === tab.id ? '2px solid hsl(205,90%,48%)' : '2px solid transparent', color: mobilePanel === tab.id ? 'hsl(205,90%,70%)' : 'hsl(240 5% 50%)', fontSize: '13px', fontWeight: mobilePanel === tab.id ? 600 : 400, cursor: 'pointer' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop: all 3 panels side-by-side */}
        {!isMobile && (
          <>
            {fileTreePanel}
            {editorPanel}
            {outputPanel}
          </>
        )}

        {/* Mobile: one panel at a time, full width */}
        {isMobile && mobilePanel === 'files' && fileTreePanel}
        {isMobile && mobilePanel === 'editor' && editorPanel}
        {isMobile && mobilePanel === 'output' && outputPanel}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
