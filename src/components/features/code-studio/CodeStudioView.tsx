'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Play, Sparkles, Plus, Trash2, Copy, X, Loader2,
  Globe, Terminal, FileCode, Crown, ArrowRight, Eye,
  ChevronDown, Upload, Check, Code2, RefreshCw,
  Save, LayoutTemplate, Github, Send,
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
type MobilePanel = 'chat' | 'editor' | 'output';

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
      content: `import { useState } from 'react';
import Card from './components/Card';
import './App.css';

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Build something amazing', done: false },
    { id: 2, text: 'Ship it to production', done: false },
  ]);
  const [input, setInput] = useState('');

  const add = () => {
    if (!input.trim()) return;
    setTodos(t => [...t, { id: Date.now(), text: input.trim(), done: false }]);
    setInput('');
  };
  const toggle = id => setTodos(t => t.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const remove = id => setTodos(t => t.filter(i => i.id !== id));

  return (
    <div className="app">
      <header className="header">
        <h1>Code Studio <span>⚛️</span></h1>
        <p>Multi-file React · npm packages · live preview</p>
      </header>
      <main className="main">
        <Card title="Tasks" count={todos.filter(t => !t.done).length + ' remaining'}>
          <div className="input-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Add a task…"
              className="input"
            />
            <button onClick={add} className="btn-primary">Add</button>
          </div>
          <ul className="todo-list">
            {todos.map(t => (
              <li key={t.id} className={'todo-item' + (t.done ? ' done' : '')}>
                <button onClick={() => toggle(t.id)} className="toggle">{t.done ? '✓' : '○'}</button>
                <span className="todo-text">{t.text}</span>
                <button onClick={() => remove(t.id)} className="remove">✕</button>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}`,
    },
    {
      id: 'react-2', name: 'components/Card.jsx',
      content: `export default function Card({ title, count, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        {count && <span className="card-badge">{count}</span>}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}`,
    },
    {
      id: 'react-3', name: 'App.css',
      content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', system-ui, sans-serif; background: #07080f; color: #e2e8f0; }

.app { min-height: 100vh; display: flex; flex-direction: column; }
.header { padding: 48px 24px 24px; text-align: center; }
.header h1 { font-size: 2rem; font-weight: 800; margin: 0 0 8px; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.header h1 span { -webkit-text-fill-color: initial; }
.header p { color: #64748b; margin: 0; font-size: 14px; }

.main { max-width: 560px; width: 100%; margin: 0 auto; padding: 0 16px 48px; }

.card { background: #0f1117; border: 1px solid #1e2130; border-radius: 16px; overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #1e2130; }
.card-title { font-size: 15px; font-weight: 600; margin: 0; }
.card-badge { font-size: 12px; background: #1e2130; color: #64748b; padding: 2px 8px; border-radius: 999px; }
.card-body { padding: 16px 20px; }

.input-row { display: flex; gap: 8px; margin-bottom: 12px; }
.input { flex: 1; background: #0a0c14; border: 1px solid #1e2130; border-radius: 10px; color: #e2e8f0; font-size: 14px; padding: 10px 14px; outline: none; font-family: inherit; }
.input:focus { border-color: #3b82f6; }
.btn-primary { padding: 10px 18px; background: #3b82f6; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: inherit; }
.btn-primary:hover { background: #2563eb; }

.todo-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.todo-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: #0a0c14; transition: opacity 0.2s; }
.todo-item.done { opacity: 0.45; }
.toggle { background: none; border: 1.5px solid #334155; border-radius: 50%; width: 22px; height: 22px; color: #4ade80; font-size: 11px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.todo-item.done .toggle { background: #4ade8020; border-color: #4ade80; }
.todo-text { flex: 1; font-size: 14px; }
.todo-item.done .todo-text { text-decoration: line-through; color: #475569; }
.remove { background: none; border: none; color: #475569; cursor: pointer; font-size: 12px; padding: 4px; }
.remove:hover { color: #f87171; }`,
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

// (transformReactCode kept for legacy single-file fallback)
function transformReactCode(src: string): string {
  return src
    .replace(/^import\s+React\s*,\s*\{\s*([^}]+)\s*\}\s+from\s+['"]react['"]\s*;?/gm, (_, n) => `const { ${n.trim()} } = React;`)
    .replace(/^import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]react['"]\s*;?/gm, (_, n) => `const { ${n.trim()} } = React;`)
    .replace(/^import\s+React\s+from\s+['"]react['"]\s*;?/gm, '')
    .replace(/^import\s+type\s+\{[^}]*\}\s+from\s+['"]react['"]\s*;?/gm, '')
    .replace(/^import\s+.*\s+from\s+['"]react['"]\s*;?/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+(?!default\s)/gm, '');
}

// Injected into every iframe — bridges console.log/warn/error to parent via postMessage
const CONSOLE_BRIDGE = `<script>
(function(){
  function send(level, args) {
    try { parent.postMessage({ type: 'cs-log', level: level, args: args.map(function(x) { return typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x); }) }, '*'); } catch(e) {}
  }
  ['log', 'info', 'warn', 'error'].forEach(function(level) {
    var orig = console[level];
    console[level] = function() {
      var a = Array.prototype.slice.call(arguments);
      send(level, a);
      if (orig) orig.apply(console, a);
    };
  });
  window.onerror = function(msg, _src, line) {
    send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
    return false;
  };
  window.addEventListener('unhandledrejection', function(e) {
    send('error', ['Unhandled: ' + ((e.reason && e.reason.message) || String(e.reason))]);
  });
})();
</` + `script>`;

// In-iframe bundler: Babel JSX transform + esm.sh npm resolution + blob URL module graph
const REACT_BUNDLER = `(async function() {
  var root = document.getElementById('root');
  var files = window.__CS_FILES__;
  var css = window.__CS_CSS__;
  if (css) { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function resolveFile(from, spec) {
    var dir = from.lastIndexOf('/') >= 0 ? from.slice(0, from.lastIndexOf('/')) : '';
    var joined = dir ? dir + '/' + spec : spec;
    var parts = joined.split('/'), out = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === '..') out.pop(); else if (parts[i] !== '.') out.push(parts[i]);
    }
    var base = out.join('/'), keys = Object.keys(files);
    return keys.find(function(n){return n===base;})
      || keys.find(function(n){return n===base+'.jsx';})
      || keys.find(function(n){return n===base+'.tsx';})
      || keys.find(function(n){return n===base+'.js';})
      || keys.find(function(n){return n===base+'.ts';})
      || keys.find(function(n){return n===base+'/index.jsx';})
      || keys.find(function(n){return n===base+'/index.js';})
      || null;
  }
  function getLocalDeps(code) {
    var re = /from\\s+['"](\\.{1,2}\\/[^'"]+)['"]/g, deps = [], m;
    while ((m = re.exec(code)) !== null) deps.push(m[1]);
    return deps;
  }
  function topoSort(names) {
    var visited = {}, order = [];
    function visit(n) {
      if (visited[n]) return; visited[n] = true;
      getLocalDeps(files[n] || '').forEach(function(s){ var d = resolveFile(n, s); if (d) visit(d); });
      order.push(n);
    }
    names.forEach(visit); return order;
  }
  var jsNames = Object.keys(files).filter(function(n){ return /\\.(jsx?|tsx?)$/.test(n); });
  var transformed = {};
  for (var i = 0; i < jsNames.length; i++) {
    var name = jsNames[i];
    try {
      transformed[name] = Babel.transform(files[name], { presets: ['react'], filename: name, retainLines: true }).code;
    } catch(e) {
      root.innerHTML = '<pre style="padding:20px;color:#f87171;font-size:13px;white-space:pre-wrap;margin:0">⚠ Syntax error in <strong>' + esc(name) + '</strong>:\\n' + esc(e.message) + '</pre>';
      console.error('Build error in ' + name + ':', e.message); return;
    }
  }
  var blobUrls = {}, order = topoSort(jsNames);
  for (var i = 0; i < order.length; i++) {
    var name = order[i], code = transformed[name];
    if (!code) continue;
    code = code.replace(/^import\\s+['"][^'"]+\\.css['"]\\s*;?/gm, '');
    code = code.replace(/from\\s+['"](\\.{1,2}\\/[^'"]+)['"]/g, function(match, spec) {
      if (/\\.css$/.test(spec)) return '';
      var dep = resolveFile(name, spec);
      return dep && blobUrls[dep] ? 'from "' + blobUrls[dep] + '"' : match;
    });
    code = code.replace(/import\\(\\s*['"](\\.{1,2}\\/[^'"]+)['"]\\s*\\)/g, function(match, spec) {
      var dep = resolveFile(name, spec); return dep && blobUrls[dep] ? 'import("' + blobUrls[dep] + '")' : match;
    });
    code = code.replace(/from\\s+['"]([^.'][^'"]*)['"]/g, function(_, pkg) {
      return pkg.startsWith('http') ? 'from "' + pkg + '"' : 'from "https://esm.sh/' + pkg + '"';
    });
    blobUrls[name] = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  }
  var priority = ['main.jsx','main.tsx','index.jsx','index.tsx','App.jsx','App.tsx'];
  var entry = null;
  for (var j = 0; j < priority.length; j++) { if (blobUrls[priority[j]]) { entry = priority[j]; break; } }
  if (!entry) { var k = Object.keys(blobUrls); entry = k[k.length - 1]; }
  if (!entry) { root.innerHTML = '<p style="padding:20px;font-family:system-ui;color:#f87171">No JavaScript files found</p>'; return; }
  try {
    var mod = await import(blobUrls[entry]);
    var AppComp = mod.default || mod.App;
    if (!AppComp) {
      root.innerHTML = '<div style="padding:24px;font-family:system-ui;color:#f87171;font-size:14px">⚠ No default export in <strong>' + esc(entry) + '</strong><br><br>Add: <code>export default function App() {}</code></div>';
      return;
    }
    var reactMod = await import('https://esm.sh/react@18');
    var rdMod = await import('https://esm.sh/react-dom@18/client');
    rdMod.createRoot(root).render((reactMod.default||reactMod).createElement(AppComp));
  } catch(e) {
    console.error(e);
    root.innerHTML = '<pre style="padding:20px;color:#f87171;font-size:13px;white-space:pre-wrap;margin:0">⚠ ' + esc(e.message) + '</pre>';
  }
})();`;

function buildPreviewSrcdoc(files: ProjectFile[], lang: Lang): string {
  if (lang === 'html') {
    const html = files.find(f => f.name.endsWith('.html'))?.content || '<!DOCTYPE html><html><head></head><body><p style="padding:20px;font-family:system-ui;color:#94a3b8">No HTML file found.</p></body></html>';
    const css = files.filter(f => f.name.endsWith('.css')).map(f => f.content).join('\n');
    const js  = files.filter(f => f.name.endsWith('.js') && !f.name.endsWith('.jsx')).map(f => f.content).join('\n');
    let doc = html;
    if (/<head>/i.test(doc)) doc = doc.replace(/<head>/i, `<head>\n${CONSOLE_BRIDGE}`);
    else doc = CONSOLE_BRIDGE + doc;
    if (css) doc = doc.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
    if (js)  doc = doc.replace('</body>', `<script>\n${js.replace(/<\/script>/gi, '<\\/script>')}\n<\/script>\n</body>`);
    return doc;
  }
  if (lang === 'react') {
    const jsFiles: Record<string, string> = {};
    const cssChunks: string[] = [];
    for (const f of files) {
      if (/\.(jsx?|tsx?)$/.test(f.name)) jsFiles[f.name] = f.content;
      else if (f.name.endsWith('.css')) cssChunks.push(f.content);
    }
    const safeFiles = JSON.stringify(jsFiles).replace(/<\//g, '<\\/');
    const safeCss   = JSON.stringify(cssChunks.join('\n')).replace(/<\//g, '<\\/');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${CONSOLE_BRIDGE}
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,sans-serif}</style>
</head>
<body>
  <div id="root"></div>
  <script>window.__CS_FILES__=${safeFiles};window.__CS_CSS__=${safeCss};<\/script>
  <script type="module">
${REACT_BUNDLER}
  <\/script>
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

interface Template { label: string; emoji: string; desc: string; lang: Lang; files: ProjectFile[]; }
const BLANK_FILE: ProjectFile = { id: 'blank-1', name: 'index.html', content: '' };
const TEMPLATES: Template[] = [
  { label: 'Blank',          emoji: '📄', desc: 'Empty file — complete clean slate',          lang: 'html',   files: [BLANK_FILE] },
  { label: 'React App',      emoji: '⚛️', desc: 'Multi-file React with components',          lang: 'react',  files: DEFAULT_FILES.react },
  { label: 'Landing Page',   emoji: '🚀', desc: 'Animated marketing page',                   lang: 'html',   files: DEFAULT_FILES.html  },
  { label: 'Python Script',  emoji: '🐍', desc: 'Python 3 executed in a secure sandbox',     lang: 'python', files: DEFAULT_FILES.python },
  { label: 'Node.js API',    emoji: '🟩', desc: 'Node.js executed in a secure sandbox',      lang: 'nodejs', files: DEFAULT_FILES.nodejs },
];

function loadSavedProjects(): Array<{ id: string; name: string; lang: Lang; files: ProjectFile[]; savedAt: string }> {
  try { return JSON.parse(localStorage.getItem('cs-projects') || '[]'); } catch { return []; }
}

export function CodeStudioView({ profile }: { profile: any }) {
  const isPro = profile?.plan_tier === 'pro' || profile?.plan_tier === 'plus';

  const [lang, setLang] = useState<Lang>('html');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFileId, setActiveFileId] = useState('');
  const [outputTab, setOutputTab] = useState<OutputTab>('preview');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('editor');
  const [isMobile, setIsMobile] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; toolCalls?: string[]; appliedCode?: boolean }>>([]);
  const [previewSrc, setPreviewSrc] = useState('');
  const [iframeLogs, setIframeLogs] = useState<Array<{ level: string; text: string }>>([]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projectName, setProjectName] = useState('my-project');
  const [projectId, setProjectId] = useState(() => Date.now().toString());
  const [showTemplates, setShowTemplates] = useState(false);
  const [githubPushing, setGithubPushing] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');

  const previewDebounce = useRef<NodeJS.Timeout>();
  const langBtnRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);
  const streamingRef = useRef<{ path: string; content: string } | null>(null);
  const [langBtnRect, setLangBtnRect] = useState<{ left: number; top: number }>({ left: 0, top: 50 });
  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Deep-link: /code-studio?prompt=... auto-opens chat with pre-filled prompt
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPrompt = params.get('prompt');
    if (urlPrompt) {
      setChatInput(decodeURIComponent(urlPrompt));
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

  // Capture console.log / errors from the preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'cs-log') return;
      const { level, args } = e.data as { level: string; args: string[] };
      setIframeLogs(prev => [...prev, { level, text: args.join(' ') }]);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  function switchLang(newLang: Lang) {
    setLang(newLang);
    setFiles([]);
    setActiveFileId('');
    setConsoleOutput('');
    setDeployUrl('');
    setIframeLogs([]);
    setShowLangPicker(false);
  }

  function clearProject() {
    setFiles([]);
    setActiveFileId('');
    setConsoleOutput('');
    setDeployUrl('');
    setGithubRepoUrl('');
    setIframeLogs([]);
    setChatMessages([]);
    setPreviewSrc('');
    setProjectId(Date.now().toString());
    setProjectName('my-project');
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
    const remaining = files.filter(f => f.id !== id);
    setFiles(remaining);
    if (activeFileId === id) setActiveFileId(remaining[0]?.id ?? '');
  }

  async function runCode() {
    if (!isPro) return toast.error('Code execution requires Plus or Pro plan');
    if (lang !== 'python' && lang !== 'nodejs') return;
    setRunning(true);
    setOutputTab('console');
    if (isMobile) setMobilePanel('output');
    setConsoleOutput('Running…\n');
    try {
      const code = files.find(f => f.name === (lang === 'python' ? 'main.py' : 'index.js'))?.content
        || activeFile?.content || '';
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
    if (!isPro) return toast.error('Deployment requires Plus or Pro plan');
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

  function applyCodeFromText(fullText: string, currentFiles: ProjectFile[]): { newFiles: ProjectFile[]; updated: boolean } {
    const newFiles = [...currentFiles];
    let updated = false;

    // Strategy 1: strict format  === filename ===\ncontent\n===END===
    const strictRegex = /===\s*([^\n=][^\n]*?)\s*===\s*\n([\s\S]*?)===\s*END\s*===/gi;
    let match;
    while ((match = strictRegex.exec(fullText)) !== null) {
      const [, fname, content] = match;
      const trimmedName = fname.trim();
      const trimmedContent = content.trim();
      const existing = newFiles.findIndex(f => f.name === trimmedName);
      if (existing >= 0) newFiles[existing] = { ...newFiles[existing], content: trimmedContent };
      else newFiles.push({ id: `ai-${Date.now()}-${trimmedName}`, name: trimmedName, content: trimmedContent });
      updated = true;
    }

    // Strategy 2: === filename === headers without END markers
    if (!updated) {
      const headerRegex = /===\s*([^\n=][^\n]*?)\s*===\s*\n/gi;
      const headers: { name: string; start: number }[] = [];
      let h;
      while ((h = headerRegex.exec(fullText)) !== null) {
        headers.push({ name: h[1].trim(), start: h.index + h[0].length });
      }
      for (let i = 0; i < headers.length; i++) {
        const end = i + 1 < headers.length ? headers[i + 1].start - headers[i + 1].name.length - 10 : fullText.length;
        const content = fullText.slice(headers[i].start, end).replace(/===\s*END\s*===/gi, '').trim();
        if (!content) continue;
        const name = headers[i].name;
        const existing = newFiles.findIndex(f => f.name === name);
        if (existing >= 0) newFiles[existing] = { ...newFiles[existing], content };
        else newFiles.push({ id: `ai-${Date.now()}-${name}`, name, content });
        updated = true;
      }
    }

    // Strategy 3: single code block — apply to active file
    if (!updated) {
      const codeBlock = fullText.match(/```(?:\w+)?\n([\s\S]+?)```/);
      if (codeBlock) {
        const content = codeBlock[1].trim();
        const idx = newFiles.findIndex(f => f.id === activeFileId);
        if (idx >= 0) { newFiles[idx] = { ...newFiles[idx], content }; updated = true; }
      }
    }

    return { newFiles, updated };
  }

  function toolLabel(tool: string, path?: string, language?: string): string {
    if (tool === 'write_file') return `📝 Writing ${path || 'file'}`;
    if (tool === 'read_file')  return `📖 Reading ${path || 'file'}`;
    if (tool === 'delete_file') return `🗑 Deleting ${path || 'file'}`;
    if (tool === 'list_files') return `📁 Listing files`;
    if (tool === 'run_code')   return `▶ Running ${language || 'code'}`;
    return tool;
  }

  async function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg = { role: 'user' as const, content: text, toolCalls: [] as string[], appliedCode: false };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setChatInput('');
    setChatLoading(true);

    // Placeholder for the streaming assistant response
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', toolCalls: [], appliedCode: false }]);

    let accText = '';
    let accTools: string[] = [];
    let filesModified = false;

    const flush = () => {
      setChatMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: 'assistant', content: accText, toolCalls: [...accTools], appliedCode: filesModified };
        return msgs;
      });
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    try {
      const res = await fetch('/api/ai/code-studio/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
          files: files.map(f => ({ name: f.name, content: f.content })),
          language: lang,
        }),
      });
      if (!res.ok) throw new Error('Agent request failed');

      const reader = res.body!.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          let ev: any;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }

          switch (ev.type) {
            case 'text':
              accText += ev.text;
              flush();
              break;

            case 'file_start': {
              // Show "Writing filename..." in tool call area
              if (!accTools.includes(`Writing ${ev.path}`)) {
                accTools = [...accTools, `Writing ${ev.path}`];
              }
              flush();
              filesModified = true;
              streamingRef.current = { path: ev.path, content: '' };
              // Create or find the file in state and switch to it
              setFiles(prev => {
                const next = [...prev];
                const idx = next.findIndex(f => f.name === ev.path);
                if (idx >= 0) {
                  next[idx] = { ...next[idx], content: '' };
                  setActiveFileId(next[idx].id);
                } else {
                  const newFile = { id: `agent-${Date.now()}-${ev.path}`, name: ev.path, content: '' };
                  next.push(newFile);
                  setActiveFileId(newFile.id);
                }
                return next;
              });
              if (isMobile) setMobilePanel('editor');
              // Clear the editor immediately for visual "writing from scratch" effect
              setTimeout(() => { editorRef.current?.setValue(''); }, 0);
              break;
            }

            case 'file_chunk': {
              if (streamingRef.current && streamingRef.current.path === ev.path) {
                streamingRef.current.content += ev.chunk;
                // Imperatively update Monaco without React re-render (fast streaming)
                editorRef.current?.setValue(streamingRef.current.content);
                // Scroll editor to bottom as code streams in
                const model = editorRef.current?.getModel();
                if (model) {
                  const lastLine = model.getLineCount();
                  editorRef.current?.revealLine(lastLine);
                }
              }
              break;
            }

            case 'file_done': {
              streamingRef.current = null;
              // Commit final content to React state + force Monaco remount for clean state
              setFiles(prev => {
                const next = [...prev];
                const idx = next.findIndex(f => f.name === ev.path);
                if (idx >= 0) {
                  next[idx] = { ...next[idx], content: ev.content };
                  setActiveFileId(next[idx].id);
                } else {
                  const newFile = { id: `agent-${Date.now()}-${ev.path}`, name: ev.path, content: ev.content };
                  next.push(newFile);
                  setActiveFileId(newFile.id);
                }
                return next;
              });
              setEditorKey(k => k + 1);
              setIframeLogs([]);
              flush();
              break;
            }

            case 'error':
              toast.error(ev.message || 'Agent error');
              break;
          }
        }
      }
    } catch (err: any) {
      accText = 'Something went wrong. Please try again.';
      flush();
      toast.error(err.message || 'Agent failed');
    } finally {
      setChatLoading(false);
      streamingRef.current = null;
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(activeFile?.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveProject() {
    const project = { id: projectId, name: projectName, lang, files, savedAt: new Date().toISOString() };
    const saved = loadSavedProjects();
    const idx = saved.findIndex(p => p.id === projectId);
    if (idx >= 0) saved[idx] = project; else saved.unshift(project);
    localStorage.setItem('cs-projects', JSON.stringify(saved.slice(0, 30)));
    toast.success('Project saved');
  }

  async function pushToGithub() {
    setGithubPushing(true);
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: files.map(f => ({ name: f.name, content: f.content })), repoName: projectName }),
      });
      const data = await res.json();
      if (res.status === 422) { toast.error('Connect GitHub in Settings first'); return; }
      if (!res.ok && res.status !== 207) { toast.error(data.error || 'GitHub push failed'); return; }
      setGithubRepoUrl(data.repoUrl);
      toast.success('Pushed to GitHub!');
    } catch (err: any) {
      toast.error(err.message || 'GitHub push failed');
    } finally {
      setGithubPushing(false);
    }
  }

  function loadTemplate(t: Template) {
    setLang(t.lang);
    setFiles(t.files);
    setActiveFileId(t.files[0].id);
    setConsoleOutput('');
    setDeployUrl('');
    setIframeLogs([]);
    setProjectId(Date.now().toString());
    setProjectName('my-project');
    setShowTemplates(false);
    setShowLangPicker(false);
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
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(262,83%,75%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plus &amp; Pro Feature</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Code Studio</h1>
          <p style={{ fontSize: '15px', color: 'hsl(240 5% 55%)', lineHeight: 1.65, marginBottom: '28px' }}>
            A full in-browser IDE with Monaco editor, live preview, AI code generation, Python &amp; Node.js execution via E2B, and one-click Vercel deployment.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto 28px', textAlign: 'left' }}>
            {['Monaco editor (VS Code in the browser)', 'Live HTML, CSS, JS & React preview', 'AI code generation with Claude', 'Python & Node.js execution (E2B)', 'One-click Vercel deployment', 'Push to GitHub in one click'].map(item => (
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

  // ── Manus-style layout ──

  // Agent chat panel (always visible left column)
  const agentPanel = (
    <div style={{ width: isMobile ? '100%' : '360px', minWidth: isMobile ? undefined : '360px', display: 'flex', flexDirection: 'column', background: 'hsl(240 8% 5%)', borderRight: isMobile ? 'none' : '1px solid hsl(240 6% 13%)', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {chatMessages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 16px 16px', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'hsl(262 83% 58% / 0.12)', border: '1px solid hsl(262 83% 58% / 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} color="hsl(262,83%,75%)" />
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(0 0% 88%)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>What do you want to build?</p>
              <p style={{ fontSize: '12.5px', color: 'hsl(240 5% 45%)', margin: 0, lineHeight: 1.65 }}>Describe your idea and the AI agent will write code, create files, and make it work — all in real time.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              {['Build a beautiful login form with validation', 'Create an animated React todo app', 'Make a dark landing page with animations', 'Write a Python data analysis script'].map(s => (
                <button key={s} onClick={() => { setChatInput(s); chatInputRef.current?.focus(); }}
                  style={{ padding: '9px 13px', background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 15%)', borderRadius: '9px', color: 'hsl(240 5% 62%)', fontSize: '12.5px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(262 83% 58% / 0.4)'; e.currentTarget.style.color = 'hsl(0 0% 80%)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(240 6% 15%)'; e.currentTarget.style.color = 'hsl(240 5% 62%)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'user' ? (
              <div style={{ maxWidth: '88%', padding: '10px 13px', borderRadius: '14px 14px 4px 14px', background: 'hsl(262 83% 58%)', color: 'white', fontSize: '13.5px', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.content}
              </div>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {msg.toolCalls.map((tc, j) => {
                      const isLast = j === msg.toolCalls!.length - 1;
                      const isRunning = chatLoading && i === chatMessages.length - 1 && isLast;
                      return (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', background: 'hsl(240 6% 9%)', border: `1px solid ${isRunning ? 'hsl(262 83% 58% / 0.3)' : 'hsl(240 6% 14%)'}`, borderRadius: '8px', fontSize: '12px', color: 'hsl(240 5% 58%)', fontFamily: 'ui-monospace, monospace' }}>
                          {isRunning
                            ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} color="hsl(262,83%,65%)" />
                            : <Check size={10} color="hsl(142,70%,55%)" style={{ flexShrink: 0 }} />}
                          <span style={{ color: isRunning ? 'hsl(262,83%,75%)' : 'inherit' }}>{tc}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(msg.content || (chatLoading && i === chatMessages.length - 1 && (!msg.toolCalls || msg.toolCalls.length === 0))) && (
                  <div style={{ padding: '10px 13px', background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '4px 14px 14px 14px', color: 'hsl(0 0% 82%)', fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content || <span style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'hsl(240 5% 48%)' }}><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Thinking…</span>}
                  </div>
                )}
                {msg.appliedCode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'hsl(142,70%,55%)', paddingLeft: '2px' }}>
                    <Check size={10} /> Files updated
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px', borderTop: '1px solid hsl(240 6% 12%)', flexShrink: 0 }}>
        <div style={{ position: 'relative', background: 'hsl(240 6% 9%)', border: `1px solid ${chatInput.trim() ? 'hsl(262 83% 58% / 0.5)' : 'hsl(240 6% 18%)'}`, borderRadius: '12px', transition: 'border-color 0.15s' }}>
          <textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
            placeholder="Describe what to build or change…"
            rows={2}
            style={{ width: '100%', background: 'none', border: 'none', color: 'hsl(0 0% 88%)', fontSize: '13.5px', padding: '11px 48px 11px 14px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: '150px', overflowY: 'auto', display: 'block', boxSizing: 'border-box' }}
            onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 150) + 'px'; }}
          />
          <button
            onClick={sendChatMessage}
            disabled={chatLoading || !chatInput.trim()}
            style={{ position: 'absolute', right: '8px', bottom: '8px', width: '34px', height: '34px', borderRadius: '9px', background: chatLoading || !chatInput.trim() ? 'hsl(240 6% 14%)' : 'hsl(262 83% 58%)', border: 'none', color: 'white', cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
          >
            {chatLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'hsl(240 5% 35%)', margin: '6px 0 0', textAlign: 'center' }}>↵ Send · Shift+↵ new line</p>
        {chatMessages.length > 0 && (
          <button onClick={() => setChatMessages([])} style={{ display: 'block', width: '100%', marginTop: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 38%)', fontSize: '11px', padding: '4px' }}>
            Clear conversation
          </button>
        )}
      </div>
    </div>
  );

  // ── Editor Panel (file tabs + Monaco) ──
  const editorPanel = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      {/* File tabs */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid hsl(240 6% 14%)', background: 'hsl(240 6% 6%)', height: '38px', flexShrink: 0 }}>
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto', height: '100%' }}>
          {files.map(file => (
            <button
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 12px', background: 'none', border: 'none', borderBottom: activeFileId === file.id ? '2px solid hsl(205,90%,48%)' : '2px solid transparent', color: activeFileId === file.id ? 'hsl(0 0% 88%)' : 'hsl(240 5% 50%)', fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', flexShrink: 0, height: '100%' }}
            >
              <FileCode size={11} />
              {file.name}
              {files.length > 1 && (
                <span
                  onClick={e => { e.stopPropagation(); deleteFile(file.id); }}
                  style={{ marginLeft: '2px', opacity: 0.5, fontSize: '14px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                >×</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNewFile(v => !v)} title="New file" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center', padding: '0 12px', height: '100%', flexShrink: 0 }}>
          <Plus size={14} />
        </button>
      </div>

      {/* New file input */}
      {showNewFile && (
        <div style={{ padding: '6px 10px', borderBottom: '1px solid hsl(240 6% 12%)', background: 'hsl(240 6% 6%)', flexShrink: 0 }}>
          <input
            autoFocus
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addFile(); if (e.key === 'Escape') setShowNewFile(false); }}
            placeholder="filename.ext"
            style={{ width: '100%', background: 'hsl(240 6% 10%)', border: '1px solid hsl(205 90% 48% / 0.4)', borderRadius: '6px', color: 'hsl(0 0% 88%)', fontSize: '13px', padding: '6px 10px', outline: 'none' }}
          />
        </div>
      )}

      {/* Monaco or empty state */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {files.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e', color: 'hsl(240 5% 40%)', textAlign: 'center', padding: '24px', gap: '10px' }}>
            <FileCode size={36} style={{ opacity: 0.2 }} />
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>Send a prompt in the chat to generate code.<br />Files will appear here as the AI writes them.</p>
          </div>
        ) : (
          <MonacoEditor
            key={`${activeFileId}-${editorKey}`}
            height="100%"
            language={getMonacoLang(activeFile?.name || 'index.html')}
            value={activeFile?.content || ''}
            onChange={v => updateActiveFile(v || '')}
            onMount={(editor) => { editorRef.current = editor; }}
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
              scrollbar: { verticalScrollbarSize: isMobile ? 8 : 6, useShadows: false },
            }}
          />
        )}
      </div>
    </div>
  );

  // ── Output Panel ──
  const outputPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'hsl(240 6% 5%)', flex: isMobile ? 1 : undefined, height: isMobile ? undefined : '260px', flexShrink: 0, borderTop: isMobile ? 'none' : '1px solid hsl(240 6% 14%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid hsl(240 6% 12%)', padding: '0 8px', gap: '4px', height: '38px', flexShrink: 0 }}>
        {canPreview && (
          <button onClick={() => setOutputTab('preview')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', background: outputTab === 'preview' ? 'hsl(240 6% 12%)' : 'none', border: 'none', color: outputTab === 'preview' ? 'hsl(0 0% 88%)' : 'hsl(240 5% 50%)', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer' }}>
            <Eye size={12} /> Preview
          </button>
        )}
        <button onClick={() => setOutputTab('console')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', background: outputTab === 'console' ? 'hsl(240 6% 12%)' : 'none', border: 'none', color: outputTab === 'console' ? 'hsl(0 0% 88%)' : 'hsl(240 5% 50%)', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer' }}>
          <Terminal size={12} /> Console
        </button>
        {outputTab === 'preview' && (
          <button onClick={() => setPreviewSrc(buildPreviewSrcdoc(files, lang))} style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', display: 'flex', padding: '5px' }} title="Refresh">
            <RefreshCw size={12} />
          </button>
        )}
        {outputTab === 'console' && (consoleOutput || iframeLogs.length > 0) && (
          <button onClick={() => { setConsoleOutput(''); setIframeLogs([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', display: 'flex', padding: '5px' }} title="Clear">
            <Trash2 size={12} />
          </button>
        )}
        <div style={{ flex: 1 }} />
        {canRun && (
          <button onClick={runCode} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'hsl(142 70% 40% / 0.15)', border: '1px solid hsl(142 70% 40% / 0.3)', borderRadius: '6px', color: 'hsl(142,70%,55%)', fontSize: '12px', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.6 : 1 }}>
            {running ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={11} />}
            {running ? 'Running…' : 'Run'}
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
          <div style={{ padding: '12px', height: '100%', overflowY: 'auto', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {iframeLogs.map((log, i) => (
              <div key={i} style={{ color: log.level === 'error' ? 'hsl(0,70%,65%)' : log.level === 'warn' ? 'hsl(38,85%,65%)' : 'hsl(142,70%,60%)', borderLeft: (log.level === 'error' || log.level === 'warn') ? `2px solid ${log.level === 'error' ? 'hsl(0,70%,50%)' : 'hsl(38,85%,55%)'}` : 'none', paddingLeft: (log.level === 'error' || log.level === 'warn') ? '8px' : '0', marginBottom: '2px' }}>
                {log.level === 'error' ? '✖ ' : log.level === 'warn' ? '⚠ ' : ''}{log.text}
              </div>
            ))}
            {consoleOutput && <div style={{ color: 'hsl(142,70%,60%)' }}>{consoleOutput}</div>}
            {!consoleOutput && iframeLogs.length === 0 && (
              <span style={{ color: 'hsl(240 5% 38%)' }}>
                {canRun ? '▶ Press Run to execute your code' : 'console.log() output appears here'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'hsl(240 10% 4%)' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', height: '46px', borderBottom: '1px solid hsl(240 6% 14%)', flexShrink: 0, overflowX: 'auto', background: 'hsl(240 8% 5%)' }}>
        <Code2 size={15} color="hsl(262,83%,75%)" />
        {!isMobile && <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(0 0% 85%)', letterSpacing: '-0.01em' }}>Code Studio</span>}
        <div style={{ width: '1px', height: '20px', background: 'hsl(240 6% 18%)', flexShrink: 0 }} />

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
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 17%)', borderRadius: '8px', color: 'hsl(0 0% 85%)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <span>{currentLang.emoji}</span>
            {!isMobile && <span>{currentLang.label}</span>}
            <ChevronDown size={11} />
          </button>
          {showLangPicker && (
            <div style={{ position: 'fixed', top: langBtnRect.top, left: langBtnRect.left, zIndex: 9999, background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '10px', padding: '6px', minWidth: '180px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
              {LANG_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => switchLang(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 10px', borderRadius: '7px', background: lang === opt.id ? 'hsl(240 6% 14%)' : 'none', border: 'none', color: lang === opt.id ? 'hsl(0 0% 90%)' : 'hsl(240 5% 65%)', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '16px' }}>{opt.emoji}</span>
                  <div><div style={{ fontWeight: 600 }}>{opt.label}</div><div style={{ fontSize: '11px', opacity: 0.6 }}>{opt.desc}</div></div>
                  {lang === opt.id && <Check size={13} style={{ marginLeft: 'auto' }} color="hsl(205,90%,60%)" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isMobile && (
          <input value={projectName} onChange={e => setProjectName(e.target.value)} style={{ background: 'none', border: 'none', color: 'hsl(240 5% 50%)', fontSize: '13px', outline: 'none', width: '100px' }} />
        )}

        <div style={{ flex: 1 }} />

        <button onClick={clearProject} title="Clear and start fresh" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 17%)', borderRadius: '7px', color: 'hsl(240 5% 60%)', fontSize: '12.5px', cursor: 'pointer', flexShrink: 0 }}>
          <RefreshCw size={12} />{!isMobile && <span>Clear</span>}
        </button>
        <button onClick={() => setShowTemplates(v => !v)} title="Load a template" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 17%)', borderRadius: '7px', color: 'hsl(240 5% 60%)', fontSize: '12.5px', cursor: 'pointer', flexShrink: 0 }}>
          <LayoutTemplate size={12} />{!isMobile && <span>Templates</span>}
        </button>
        <button onClick={saveProject} title="Save" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 17%)', borderRadius: '7px', color: 'hsl(240 5% 60%)', cursor: 'pointer', flexShrink: 0 }}>
          <Save size={13} />
        </button>
        <button onClick={copyCode} title="Copy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 17%)', borderRadius: '7px', color: copied ? 'hsl(142,70%,55%)' : 'hsl(240 5% 60%)', cursor: 'pointer', flexShrink: 0 }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
        <button onClick={deployToVercel} disabled={deploying} title="Deploy to Vercel" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.25)', borderRadius: '7px', color: 'hsl(205,90%,60%)', fontSize: '12.5px', fontWeight: 600, cursor: deploying ? 'not-allowed' : 'pointer', opacity: deploying ? 0.6 : 1, flexShrink: 0 }}>
          {deploying ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={12} />}
          {!isMobile && <span>Deploy</span>}
        </button>
        <button onClick={pushToGithub} disabled={githubPushing} title="Push to GitHub" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', background: 'hsl(240 5% 12%)', border: '1px solid hsl(240 5% 20%)', borderRadius: '7px', color: 'hsl(240 5% 65%)', fontSize: '12.5px', fontWeight: 600, cursor: githubPushing ? 'not-allowed' : 'pointer', opacity: githubPushing ? 0.6 : 1, flexShrink: 0 }}>
          {githubPushing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Github size={12} />}
          {!isMobile && <span>GitHub</span>}
        </button>
      </div>

      {/* Mobile tab switcher */}
      {isMobile && (
        <div style={{ display: 'flex', background: 'hsl(240 6% 6%)', borderBottom: '1px solid hsl(240 6% 14%)', flexShrink: 0 }}>
          {([
            { id: 'chat', label: 'AI Chat', icon: <Sparkles size={13} /> },
            { id: 'editor', label: 'Editor', icon: <FileCode size={13} /> },
            { id: 'output', label: canPreview ? 'Preview' : 'Console', icon: canPreview ? <Eye size={13} /> : <Terminal size={13} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setMobilePanel(tab.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px 6px', background: 'none', border: 'none', borderBottom: mobilePanel === tab.id ? '2px solid hsl(262,83%,58%)' : '2px solid transparent', color: mobilePanel === tab.id ? 'hsl(262,83%,75%)' : 'hsl(240 5% 50%)', fontSize: '12.5px', fontWeight: mobilePanel === tab.id ? 600 : 400, cursor: 'pointer' }}>
              {tab.icon}{tab.label}
            </button>
          )))}
        </div>
      )}

      {/* Deploy / GitHub banners */}
      {deployUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: 'hsl(142 70% 40% / 0.1)', borderBottom: '1px solid hsl(142 70% 40% / 0.2)', flexShrink: 0 }}>
          <Check size={12} color="hsl(142,70%,55%)" />
          <span style={{ fontSize: '12.5px', color: 'hsl(142,70%,60%)', fontWeight: 500 }}>Deployed!</span>
          <a href={deployUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12.5px', color: 'hsl(205,90%,60%)', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deployUrl}</a>
          <button onClick={() => setDeployUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex' }}><X size={13} /></button>
        </div>
      )}
      {githubRepoUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: 'hsl(240 5% 10%)', borderBottom: '1px solid hsl(240 5% 18%)', flexShrink: 0 }}>
          <Github size={12} color="hsl(240 5% 70%)" />
          <span style={{ fontSize: '12.5px', color: 'hsl(240 5% 70%)', fontWeight: 500 }}>Pushed!</span>
          <a href={githubRepoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12.5px', color: 'hsl(205,90%,60%)', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{githubRepoUrl}</a>
          <button onClick={() => setGithubRepoUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex' }}><X size={13} /></button>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop: Agent chat (left) | Editor + Output (right) */}
        {!isMobile && (
          <>
            {agentPanel}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {editorPanel}
              {outputPanel}
            </div>
          </>
        )}
        {/* Mobile: one panel at a time */}
        {isMobile && mobilePanel === 'chat' && agentPanel}
        {isMobile && mobilePanel === 'editor' && editorPanel}
        {isMobile && mobilePanel === 'output' && outputPanel}
      </div>

      {/* Template picker modal */}
      {showTemplates && (
        <div onClick={() => setShowTemplates(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>New Project</h2>
              <button onClick={() => setShowTemplates(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {TEMPLATES.map(t => (
                <button key={t.label} onClick={() => loadTemplate(t)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '16px', background: 'hsl(240 6% 11%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'hsl(205 90% 48% / 0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(240 6% 18%)')}
                >
                  <span style={{ fontSize: '24px' }}>{t.emoji}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(0 0% 90%)' }}>{t.label}</span>
                  <span style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', lineHeight: 1.4 }}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
