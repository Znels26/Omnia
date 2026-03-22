'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Plus, Trash2, Send, Sparkles, Copy, Check, ChevronDown, ArrowLeft, ImageIcon, Search, ArrowRight, BookOpen, ListPlus } from 'lucide-react';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ToolSuggestion { label: string; href: string; emoji: string; reason: string; }

function isCodeRequest(text: string): boolean {
  const t = text.trim();
  return /\b(build|create|make|write|code|develop)\s+(a\s+|an\s+|me\s+a?\s*)?(website|web\s*app|app|landing\s+page|portfolio|calculator|game|to.?do|dashboard|component|script|function|program|tool|form|ui|interface)\b/i.test(t)
    || /\b(build|create|make|write)\s+(me\s+)?(some\s+)?(html|css|javascript|react|python|node\.?js)\b/i.test(t)
    || /\b(html|css|javascript|react|python|node\.?js)\s+(website|app|script|code|project|example)\b/i.test(t);
}

function detectToolSuggestion(content: string): ToolSuggestion | null {
  const t = content.toLowerCase();
  // Finance
  if (/\b(budget|budgeting|overspend|monthly spend|spending plan|financial plan)\b/.test(t))
    return { label: 'Budget Planner', href: '/life-hub', emoji: '📊', reason: 'Create a personalised budget in Life Hub' };
  if (/\b(invest|investment|stocks?|etf|isa|portfolio|passive income|dividends?)\b/.test(t))
    return { label: 'Investment Ideas', href: '/life-hub', emoji: '📈', reason: 'Get AI investment suggestions in Life Hub' };
  if (/\b(debt|loan|credit card|pay off|interest rate|snowball|avalanche)\b/.test(t))
    return { label: 'Debt Payoff Planner', href: '/life-hub', emoji: '🔓', reason: 'Build a debt payoff plan in Life Hub' };
  if (/\b(tax|self.?assessment|national insurance|hmrc|freelance tax|tax return)\b/.test(t))
    return { label: 'Tax Estimator', href: '/life-hub', emoji: '🧮', reason: 'Estimate your tax bill in Life Hub' };
  if (/\b(savings?|save money|emergency fund|saving goal|savings pot)\b/.test(t))
    return { label: 'Savings Goals', href: '/life-hub', emoji: '🏦', reason: 'Set up a savings roadmap in Life Hub' };
  if (/\b(net worth|assets|liabilities|financial health|wealth)\b/.test(t))
    return { label: 'Financial Health Score', href: '/life-hub', emoji: '❤️‍🔥', reason: 'Score your finances in Life Hub' };
  // Fitness
  if (/\b(workout|gym|exercise|weight training|strength training|muscle|lifting)\b/.test(t))
    return { label: 'Workout Planner', href: '/life-hub', emoji: '🏋️', reason: 'Get a personalised workout plan in Life Hub' };
  if (/\b(meal plan|meal prep|eat healthy|diet|nutrition|calories?|macros?|protein)\b/.test(t))
    return { label: 'Meal Planner', href: '/life-hub', emoji: '🥗', reason: 'Generate a weekly meal plan in Life Hub' };
  if (/\b(weight loss|fat loss|lose weight|cut|bulk|body fat|bmi)\b/.test(t))
    return { label: 'Calorie & Macro Tracker', href: '/life-hub', emoji: '🔢', reason: 'Get your exact macro targets in Life Hub' };
  if (/\b(supplement|creatine|protein powder|pre.?workout|recovery|sleep quality)\b/.test(t))
    return { label: 'Supplement Guide', href: '/life-hub', emoji: '💊', reason: 'Get evidence-based supplement advice in Life Hub' };
  if (/\b(fitness goal|fitness challenge|30.?day|habit streak|step goal|running plan)\b/.test(t))
    return { label: 'Challenge Creator', href: '/life-hub', emoji: '🏆', reason: 'Create a 30-day fitness challenge in Life Hub' };
  // AI Money Tools
  if (/\b(lead magnet|freebie|opt.?in|email list|grow.+list)\b/.test(t))
    return { label: 'Lead Magnet Builder', href: '/ai-tools', emoji: '🧲', reason: 'Build your lead magnet with AI Money Tools' };
  if (/\b(seo|blog post|keyword|rank|search engine|content strategy)\b/.test(t))
    return { label: 'SEO Blog Writer', href: '/ai-tools', emoji: '✍️', reason: 'Write an SEO blog post with AI Money Tools' };
  if (/\b(email sequence|nurture|drip campaign|email marketing|welcome sequence)\b/.test(t))
    return { label: 'Email Sequence Builder', href: '/ai-tools', emoji: '📧', reason: 'Build your email sequence with AI Money Tools' };
  // Content Studio
  if (/\b(caption|instagram|social post|twitter|linkedin|tiktok|facebook post|content ideas?)\b/.test(t))
    return { label: 'Content Studio', href: '/content-studio', emoji: '✨', reason: 'Generate polished content in Content Studio' };
  if (/\b(video script|youtube script|podcast script|script for)\b/.test(t))
    return { label: 'Script Writer', href: '/content-studio', emoji: '🎬', reason: 'Write your script in Content Studio' };
  // Document Builder
  if (/\b(write a report|create a document|export.*(pdf|word|docx)|formal document|business report|presentation slides?)\b/.test(t))
    return { label: 'Document Builder', href: '/document-builder', emoji: '📄', reason: 'Build and export this document' };
  // Invoices
  if (/\b(invoice|client billing|bill.+client|charge.+client|payment.+due|hourly rate)\b/.test(t))
    return { label: 'Invoices', href: '/invoices', emoji: '🧾', reason: 'Create and send an invoice' };
  // Proposals
  if (/\b(business proposal|client proposal|pitch.+client|scope of work|proposal for)\b/.test(t))
    return { label: 'Proposals', href: '/proposal', emoji: '📋', reason: 'Generate a professional proposal' };
  // Planner / tasks
  if (/\b(to.?do list|task list|action items?|next steps?|project plan|set.+goals?|deadline)\b/.test(t))
    return { label: 'Planner', href: '/planner', emoji: '📅', reason: 'Add these tasks and goals to your Planner' };
  // Reminders
  if (/\b(remind me|set.+reminder|don.?t forget|follow.?up|schedule.+alert)\b/.test(t))
    return { label: 'Reminders', href: '/reminders', emoji: '🔔', reason: 'Set a reminder so you don\'t forget' };
  // My Stack
  if (/\b(software.+use|tools? i use|subscription|saas|app stack|tech stack)\b/.test(t))
    return { label: 'My Stack', href: '/my-stack', emoji: '🗂️', reason: 'Track your tools and subscriptions in My Stack' };
  return null;
}

// Detect if a response looks like saveable content (plan, list, notes-worthy)
function detectSaveActions(content: string): { saveNote: boolean; saveTask: boolean } {
  const t = content.toLowerCase();
  const saveNote = content.length > 120 && /\b(here('s| is)|below|following|summary|overview|guide|tips?|steps?|plan|advice)\b/.test(t);
  const saveTask = /(\n[-*]\s|\n\d+\.\s)/.test(content) && /\b(steps?|tasks?|action|to.?do|next|plan|checklist)\b/.test(t);
  return { saveNote, saveTask };
}

const MODES = [
  { value: 'general', label: '✨ General' },
  { value: 'productivity', label: '⚡ Productivity' },
  { value: 'writing', label: '✍️ Writing' },
  { value: 'study', label: '📚 Study' },
  { value: 'planning', label: '🎯 Planning' },
  { value: 'documents', label: '📄 Documents' },
];

const STARTERS: Record<string, string[]> = {
  general: ['Explain something to me', 'Help me brainstorm', 'Review my writing', 'Answer a question'],
  productivity: ['Help me prioritize tasks', 'Plan my day', 'Break down a project', 'Beat procrastination'],
  writing: ['Write a professional email', 'Improve this paragraph', 'Blog post outline', 'Creative writing help'],
  study: ['Explain a concept', 'Create study flashcards', 'Summarize key points', 'Quiz me on a topic'],
  planning: ['Plan a project', 'Set SMART goals', 'Create a weekly plan', 'Map out a strategy'],
  documents: ['Summarize a document', 'Extract key info', 'Analyze this content', 'Create table of contents'],
};

function isImageRequest(text: string): boolean {
  return /^(\/image\s|generate\s+(an?\s+)?image\s|create\s+(an?\s+)?image\s|draw\s|imagine\s|make\s+(an?\s+)?image\s|paint\s|render\s+a\s|show\s+me\s+(an?\s+)?image\s|generate\s+(a\s+)?picture\s|create\s+(a\s+)?picture\s)/i.test(text.trim());
}

function extractImagePrompt(text: string): string {
  return text
    .replace(/^\/image\s+/i, '')
    .replace(/^generate\s+(an?\s+)?image\s+(of\s+)?/i, '')
    .replace(/^create\s+(an?\s+)?image\s+(of\s+)?/i, '')
    .replace(/^draw\s+(an?\s+|me\s+)?/i, '')
    .replace(/^imagine\s+/i, '')
    .replace(/^make\s+(an?\s+)?image\s+(of\s+)?/i, '')
    .replace(/^paint\s+(an?\s+|me\s+)?/i, '')
    .replace(/^render\s+a\s+/i, '')
    .replace(/^show\s+me\s+(an?\s+)?image\s+(of\s+)?/i, '')
    .replace(/^generate\s+(a\s+)?picture\s+(of\s+)?/i, '')
    .replace(/^create\s+(a\s+)?picture\s+(of\s+)?/i, '')
    .trim() || text.trim();
}

function isSummariseRequest(text: string): boolean {
  const t = text.trim();
  if (/^(\/summaris[ez]|\/sum\s)/i.test(t)) return true;
  const lines = t.split('\n');
  if (lines.length > 6 && t.length > 400 && /\b(meeting|transcript|attendees|action items|agenda|minutes|discussed|decided|follow.?up|next steps)\b/i.test(t)) return true;
  return false;
}

function extractSummariseContent(text: string): string {
  return text.replace(/^\/summaris[ez]\s*/i, '').replace(/^\/sum\s+/i, '').trim() || text.trim();
}

function isSearchRequest(text: string): boolean {
  return /^(\/search\s|search\s+for\s|look\s+up\s|find\s+(news|info)\s+(on|about)\s|latest\s+news\s|what'?s\s+the\s+latest\s|current\s+news\s|breaking\s+news\s|today'?s\s+news\s|news\s+about\s|what\s+happened\s+(to|with)\s)/i.test(text.trim());
}

function extractSearchQuery(text: string): string {
  return text
    .replace(/^\/search\s+/i, '')
    .replace(/^search\s+for\s+/i, '')
    .replace(/^look\s+up\s+/i, '')
    .replace(/^find\s+(news|info)\s+(on|about)\s+/i, '')
    .replace(/^latest\s+news\s+(on|about)?\s*/i, '')
    .replace(/^what'?s\s+the\s+latest\s+(on|about)?\s*/i, '')
    .replace(/^current\s+news\s+(on|about)?\s*/i, '')
    .replace(/^breaking\s+news\s+(on|about)?\s*/i, '')
    .replace(/^today'?s\s+news\s+(on|about)?\s*/i, '')
    .replace(/^news\s+about\s+/i, '')
    .replace(/^what\s+happened\s+(to|with)\s+/i, '')
    .trim() || text.trim();
}

function renderMarkdown(text: string) {
  if (!text) return '';

  // Process line by line so list grouping is correct
  const lines = text.split('\n');
  const output: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Inline: images
    line = line.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+|data:image\/[^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px;margin:8px 0;display:block" loading="lazy" />');
    // Inline: bold-italic, bold, italic
    line = line.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline: code
    line = line.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em">$1</code>');

    // Block: headers
    if (/^### /.test(line)) {
      if (inList) { output.push('</ul>'); inList = false; }
      output.push(`<h3 style="font-size:15px;font-weight:700;margin:12px 0 4px">${line.slice(4)}</h3>`);
      continue;
    }
    if (/^## /.test(line)) {
      if (inList) { output.push('</ul>'); inList = false; }
      output.push(`<h2 style="font-size:17px;font-weight:700;margin:14px 0 6px">${line.slice(3)}</h2>`);
      continue;
    }
    if (/^# /.test(line)) {
      if (inList) { output.push('</ul>'); inList = false; }
      output.push(`<h1 style="font-size:19px;font-weight:700;margin:16px 0 8px">${line.slice(2)}</h1>`);
      continue;
    }

    // Block: list items (- or 1. 2. etc.)
    const bulletMatch = line.match(/^[-*] (.*)/);
    const orderedMatch = line.match(/^\d+\. (.*)/);
    if (bulletMatch || orderedMatch) {
      if (!inList) { output.push('<ul style="padding-left:20px;margin:8px 0">'); inList = true; }
      output.push(`<li style="margin:3px 0;padding-left:4px">${(bulletMatch || orderedMatch)![1]}</li>`);
      continue;
    }

    // Blank line: close list and add spacing
    if (line.trim() === '') {
      if (inList) { output.push('</ul>'); inList = false; }
      output.push('<br/>');
      continue;
    }

    // Normal text
    if (inList) { output.push('</ul>'); inList = false; }
    output.push(`<span>${line}</span><br/>`);
  }

  if (inList) output.push('</ul>');
  return output.join('');
}

// Moved outside to prevent re-creation on every render
function ChatItem({ chat, active, onSelect, onDelete }: any) {
  return (
    <div
      onClick={onSelect}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: active ? 'hsl(205 90% 48% / 0.1)' : 'transparent', marginBottom: '2px' }}
    >
      <MessageSquare size={13} color={active ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 50%)'} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'hsl(205, 90%, 70%)' : 'hsl(240 5% 70%)' }}>{chat.title}</span>
      <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'hsl(240 5% 50%)', display: 'flex', flexShrink: 0, touchAction: 'manipulation' }}>
        <Trash2 size={11} />
      </button>
    </div>
  );
}

export function AssistantView({ profile, initialChats }: any) {
  const [chats, setChats] = useState(initialChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [searching, setSearching] = useState(false);
  const [summarising, setSummarising] = useState(false);
  const [mode, setMode] = useState(profile?.assistant_mode || 'general');
  const [showModes, setShowModes] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [dismissedSuggestion, setDismissedSuggestion] = useState<string | null>(null);
  const [savedMsgIds, setSavedMsgIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const busy = streaming || generatingImage || searching || summarising;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = useCallback(async (chatId: string) => {
    setMessages([]);
    try {
      const res = await fetch(`/api/ai/chat/${chatId}/messages`);
      if (!res.ok) { toast.error('Failed to load messages'); return; }
      const d = await res.json();
      setMessages(d.messages || []);
    } catch { toast.error('Failed to load messages'); }
  }, []);

  const selectChat = useCallback(async (chatId: string) => {
    setActiveChatId(chatId);
    await loadMessages(chatId);
    setShowSidebar(false);
    inputRef.current?.focus();
  }, [loadMessages]);

  const newChat = useCallback(async () => {
    const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) });
    if (res.ok) {
      const { chat } = await res.json();
      setChats((p: any[]) => [chat, ...p]);
      setActiveChatId(chat.id);
      setMessages([]);
      setShowSidebar(false);
    }
  }, [mode]);

  const ensureChat = useCallback(async (title: string) => {
    if (activeChatId) return activeChatId;
    const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, title: title.slice(0, 60) }) });
    if (!res.ok) { toast.error('Failed to create chat'); return null; }
    const { chat } = await res.json();
    setChats((p: any[]) => [chat, ...p]);
    setActiveChatId(chat.id);
    return chat.id;
  }, [activeChatId, mode]);

  const sendImage = useCallback(async (rawText: string) => {
    const prompt = extractImagePrompt(rawText);
    const chatId = await ensureChat(rawText);
    if (!chatId) return;
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: rawText, created_at: new Date().toISOString() };
    const loadingId = `img-${Date.now()}`;
    setMessages(p => [...p, userMsg, { id: loadingId, role: 'assistant', content: '', created_at: new Date().toISOString() }]);
    setInput('');
    setGeneratingImage(true);
    try {
      const res = await fetch('/api/ai/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, prompt }) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Image generation failed'); setMessages(p => p.filter(m => m.id !== loadingId)); return; }
      const { message, userMessage, imageUrl } = await res.json();
      const assistantMsg = message || (imageUrl ? { id: loadingId, role: 'assistant', content: `![Generated image](${imageUrl})\n\n*${prompt}*`, created_at: new Date().toISOString() } : null);
      if (!assistantMsg) { toast.error('Image generation failed'); setMessages(p => p.filter(m => m.id !== loadingId)); return; }
      setMessages(p => p.map(m => {
        if (m.id === loadingId) return assistantMsg;
        // Replace optimistic user message with DB version so IDs are consistent on reload
        if (m.id === userMsg.id && userMessage) return userMessage;
        return m;
      }));
      setChats((p: any[]) => p.map(c => c.id === chatId ? { ...c, last_message_at: new Date().toISOString() } : c));
    } catch { toast.error('Connection error'); setMessages(p => p.filter(m => m.id !== loadingId)); }
    finally { setGeneratingImage(false); }
  }, [ensureChat]);

  const sendSearch = useCallback(async (rawText: string) => {
    const query = extractSearchQuery(rawText);
    const chatId = await ensureChat(rawText);
    if (!chatId) return;
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: rawText, created_at: new Date().toISOString() };
    const aiId = `s-${Date.now()}`;
    setMessages(p => [...p, userMsg, { id: aiId, role: 'assistant', content: '', created_at: new Date().toISOString() }]);
    setInput('');
    setSearching(true);
    try {
      const res = await fetch('/api/ai/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, query, messages: messages.slice(-6).map((m: any) => ({ role: m.role, content: m.content })) }) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Search failed'); setMessages(p => p.filter(m => m.id !== aiId)); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6);
          if (d === '[DONE]') continue;
          try {
            const p = JSON.parse(d);
            if (p.token) { acc += p.token; setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: acc } : m)); }
            if (p.finalMessage) { setMessages(prev => prev.map(m => m.id === aiId ? p.finalMessage : m)); setChats((prev: any[]) => prev.map(c => c.id === chatId ? { ...c, last_message_at: new Date().toISOString() } : c)); }
            if (p.error) { toast.error(p.error); setMessages(p => p.filter(m => m.id !== aiId)); }
          } catch {}
        }
      }
    } catch (e: any) { if (e?.name !== 'AbortError') toast.error('Connection error'); }
    finally { setSearching(false); }
  }, [ensureChat, messages]);

  const sendSummarise = useCallback(async (rawText: string) => {
    const content = extractSummariseContent(rawText);
    const chatId = await ensureChat('Meeting Summary');
    if (!chatId) return;
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: rawText, created_at: new Date().toISOString() };
    const aiId = `sum-${Date.now()}`;
    setMessages(p => [...p, userMsg, { id: aiId, role: 'assistant', content: '', created_at: new Date().toISOString() }]);
    setInput('');
    setSummarising(true);
    try {
      const prompt = `Please summarise the following meeting transcript or notes. Structure your response with these sections:\n## Summary\n## Key Decisions\n## Action Items\n## Next Steps\n\n---\n\n${content}`;
      const res = await fetch('/api/ai/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, content: prompt, mode: 'documents', messages: [] }) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Summarise failed'); setMessages(p => p.filter(m => m.id !== aiId)); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6);
          if (d === '[DONE]') continue;
          try {
            const p = JSON.parse(d);
            if (p.token) { acc += p.token; setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: acc } : m)); }
            if (p.finalMessage) { setMessages(prev => prev.map(m => m.id === aiId ? p.finalMessage : m)); setChats((prev: any[]) => prev.map(c => c.id === chatId ? { ...c, last_message_at: new Date().toISOString() } : c)); }
            if (p.error) { toast.error(p.error); setMessages(p => p.filter(m => m.id !== aiId)); }
          } catch {}
        }
      }
    } catch (e: any) { if (e?.name !== 'AbortError') toast.error('Connection error'); }
    finally { setSummarising(false); }
  }, [ensureChat, messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (isImageRequest(text)) { await sendImage(text); return; }
    if (isSearchRequest(text)) { await sendSearch(text); return; }
    if (isSummariseRequest(text)) { await sendSummarise(text); return; }

    const chatId = await ensureChat(text);
    if (!chatId) return;
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() };
    const aiMsg = { id: `a-${Date.now()}`, role: 'assistant', content: '', created_at: new Date().toISOString() };
    setMessages(p => [...p, userMsg, aiMsg]);
    setInput('');
    setStreaming(true);
    try {
      const res = await fetch('/api/ai/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, content: text, mode, messages: messages.slice(-8).map((m: any) => ({ role: m.role, content: m.content })) }) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'AI error'); setMessages(p => p.filter(m => m.id !== aiMsg.id)); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6);
            if (d === '[DONE]') continue;
            try {
              const p = JSON.parse(d);
              if (p.token) { acc += p.token; setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: acc } : m)); }
              if (p.finalMessage) { setMessages(prev => prev.map(m => m.id === aiMsg.id ? p.finalMessage : m)); setChats((prev: any[]) => prev.map(c => c.id === chatId ? { ...c, message_count: (c.message_count || 0) + 2, last_message_at: new Date().toISOString() } : c)); }
              if (p.error) { toast.error(p.error); setMessages(p => p.filter(m => m.id !== aiMsg.id)); }
            } catch {}
          }
        }
      }
    } catch (e: any) { if (e?.name !== 'AbortError') toast.error('Connection error'); }
    finally { setStreaming(false); }
  }, [input, busy, sendImage, sendSearch, sendSummarise, ensureChat, mode, messages]);

  const copyMsg = useCallback(async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id); setTimeout(() => setCopied(null), 2000); toast.success('Copied!');
  }, []);

  const saveToNotes = useCallback(async (content: string, msgId: string) => {
    const title = content.split('\n')[0].replace(/^#+\s*/, '').slice(0, 60) || 'AI Response';
    const res = await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) });
    if (res.ok) { toast.success('Saved to Notes!'); setSavedMsgIds(p => new Set([...p, `note-${msgId}`])); }
    else { const d = await res.json(); toast.error(d.error || 'Failed to save'); }
  }, []);

  const saveToPlanner = useCallback(async (content: string, msgId: string) => {
    const title = content.split('\n')[0].replace(/^#+\s*/, '').slice(0, 80) || 'AI Task';
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, notes: content, priority: 'medium', status: 'pending' }) });
    if (res.ok) { toast.success('Added to Planner!'); setSavedMsgIds(p => new Set([...p, `task-${msgId}`])); }
    else { const d = await res.json(); toast.error(d.error || 'Failed to add'); }
  }, []);

  const deleteChat = useCallback(async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    await fetch(`/api/ai/chat/${chatId}`, { method: 'DELETE' });
    setChats((p: any[]) => p.filter(c => c.id !== chatId));
    if (activeChatId === chatId) { setActiveChatId(null); setMessages([]); }
  }, [activeChatId]);

  const pinned = useMemo(() => chats.filter((c: any) => c.is_pinned), [chats]);
  const recent = useMemo(() => chats.filter((c: any) => !c.is_pinned), [chats]);

  // Detect input type for badge display
  const inputType = useMemo(() => {
    const t = input.trim();
    if (!t) return null;
    if (isImageRequest(t)) return 'image';
    if (isSearchRequest(t)) return 'search';
    if (isSummariseRequest(t)) return 'summarise';
    if (isCodeRequest(t)) return 'code';
    return null;
  }, [input]);

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={newChat} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '9px', background: 'hsl(205, 90%, 48%)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600, touchAction: 'manipulation' }}>
          <Plus size={15} /> New Chat
        </button>
        <button onClick={() => setShowSidebar(false)} style={{ padding: '10px', borderRadius: '9px', background: 'hsl(240 6% 12%)', border: 'none', cursor: 'pointer', color: 'hsl(0 0% 70%)', display: 'none', touchAction: 'manipulation' }} className="sidebar-close">
          <ArrowLeft size={15} />
        </button>
      </div>
      <div style={{ padding: '8px', borderBottom: '1px solid hsl(240 6% 14%)', position: 'relative' }}>
        <button onClick={() => setShowModes(!showModes)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', background: 'hsl(240 6% 11%)', border: 'none', cursor: 'pointer', color: 'hsl(0 0% 88%)', fontSize: '13px', touchAction: 'manipulation' }}>
          <span>{MODES.find(m => m.value === mode)?.label || '✨ General'}</span>
          <ChevronDown size={14} />
        </button>
        {showModes && (
          <div style={{ position: 'absolute', top: '100%', left: '8px', right: '8px', background: 'hsl(240 8% 9%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '10px', zIndex: 20, overflow: 'hidden' }}>
            {MODES.map(m => (
              <button key={m.value} onClick={() => { setMode(m.value); setShowModes(false); }} style={{ width: '100%', padding: '10px 12px', background: mode === m.value ? 'hsl(205 90% 48% / 0.1)' : 'transparent', border: 'none', cursor: 'pointer', color: mode === m.value ? 'hsl(205, 90%, 60%)' : 'hsl(0 0% 75%)', textAlign: 'left', fontSize: '13px', touchAction: 'manipulation' }}>
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px', overscrollBehavior: 'contain' }}>
        {pinned.length > 0 && <>
          <p style={{ padding: '6px 8px 4px', fontSize: '10px', color: 'hsl(240 5% 45%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pinned</p>
          {pinned.map((c: any) => <ChatItem key={c.id} chat={c} active={activeChatId === c.id} onSelect={() => selectChat(c.id)} onDelete={(e: any) => deleteChat(c.id, e)} />)}
        </>}
        {recent.length > 0 && <>
          {pinned.length > 0 && <p style={{ padding: '8px 8px 4px', fontSize: '10px', color: 'hsl(240 5% 45%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent</p>}
          {recent.map((c: any) => <ChatItem key={c.id} chat={c} active={activeChatId === c.id} onSelect={() => selectChat(c.id)} onDelete={(e: any) => deleteChat(c.id, e)} />)}
        </>}
        {chats.length === 0 && <div style={{ padding: '32px 16px', textAlign: 'center' }}><p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)' }}>No conversations yet</p></div>}
      </div>
    </div>
  );

  return (
    <div className="split-view" style={{ position: 'relative' }}>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowSidebar(false)} />
          <div style={{ position: 'relative', width: '280px', maxWidth: '85vw', background: 'hsl(240 10% 5%)', borderRight: '1px solid hsl(240 6% 14%)', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div style={{ width: '260px', borderRight: '1px solid hsl(240 6% 14%)', background: 'hsl(240 10% 4%)', flexShrink: 0, display: 'flex', flexDirection: 'column' }} className="desktop-only">
        <SidebarContent />
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={() => setShowSidebar(true)} style={{ display: 'none', padding: '8px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 0% 70%)', touchAction: 'manipulation' }} className="mobile-only">
            <MessageSquare size={18} />
          </button>
          <Sparkles size={15} color="hsl(205, 90%, 60%)" />
          <span style={{ fontWeight: 600, fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {chats.find((c: any) => c.id === activeChatId)?.title || 'New Conversation'}
          </span>
          <span style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', flexShrink: 0 }}>{mode}</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', overscrollBehavior: 'contain' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '40px 16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'hsl(205 90% 48% / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} color="hsl(205, 90%, 60%)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>How can I help?</h2>
                <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)' }}>I'm in <strong style={{ color: 'hsl(205, 90%, 60%)' }}>{mode}</strong> mode</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '480px' }}>
                {(STARTERS[mode] || STARTERS.general).map((s: string) => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid hsl(240 6% 16%)', background: 'transparent', color: 'hsl(0 0% 75%)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation' }}>
                    {s}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: 'hsl(240 5% 40%)', textAlign: 'center', maxWidth: '380px' }}>
                Try: <strong style={{ color: 'hsl(240 5% 55%)' }}>"draw…"</strong> for images · <strong style={{ color: 'hsl(240 5% 55%)' }}>"search for…"</strong> for web search
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: '740px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg: any) => (
                <div key={msg.id} style={{ display: 'flex', gap: '10px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'hsl(205 90% 48% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Sparkles size={13} color="hsl(205, 90%, 60%)" />
                    </div>
                  )}
                  <div
                    className={msg.role === 'user' ? 'chat-user' : 'chat-ai'}
                    style={{ maxWidth: '82%', padding: '10px 14px', fontSize: '14px', lineHeight: 1.65 }}
                  >
                    {msg.content ? (
                      msg.role === 'assistant' ? (
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      ) : (
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                      )
                    ) : (
                      <span className="typing" />
                    )}
                    {msg.role === 'assistant' && msg.content && (
                      <>
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid hsl(240 6% 20%)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button onClick={() => copyMsg(msg.content, msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 0', touchAction: 'manipulation' }}>
                            {copied === msg.id ? <><Check size={12} color="#34d399" /> Copied</> : <><Copy size={12} /> Copy</>}
                          </button>
                          {(() => {
                            const { saveNote, saveTask } = detectSaveActions(msg.content);
                            return <>
                              {saveNote && (
                                <button onClick={() => saveToNotes(msg.content, msg.id)} disabled={savedMsgIds.has(`note-${msg.id}`)} style={{ background: 'none', border: 'none', cursor: savedMsgIds.has(`note-${msg.id}`) ? 'default' : 'pointer', color: savedMsgIds.has(`note-${msg.id}`) ? '#34d399' : 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 0', touchAction: 'manipulation' }}>
                                  <BookOpen size={12} /> {savedMsgIds.has(`note-${msg.id}`) ? 'Saved' : 'Save to Notes'}
                                </button>
                              )}
                              {saveTask && (
                                <button onClick={() => saveToPlanner(msg.content, msg.id)} disabled={savedMsgIds.has(`task-${msg.id}`)} style={{ background: 'none', border: 'none', cursor: savedMsgIds.has(`task-${msg.id}`) ? 'default' : 'pointer', color: savedMsgIds.has(`task-${msg.id}`) ? '#34d399' : 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 0', touchAction: 'manipulation' }}>
                                  <ListPlus size={12} /> {savedMsgIds.has(`task-${msg.id}`) ? 'Added' : 'Add to Planner'}
                                </button>
                              )}
                            </>;
                          })()}
                        </div>
                        {/* Contextual tool suggestion — only on last AI message */}
                        {!streaming && messages[messages.length - 1]?.id === msg.id && (() => {
                          const suggestion = detectToolSuggestion(msg.content);
                          if (!suggestion || dismissedSuggestion === msg.id) return null;
                          return (
                            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: 'hsl(205 90% 48% / 0.07)', border: '1px solid hsl(205 90% 48% / 0.2)' }}>
                              <span style={{ fontSize: '16px', flexShrink: 0 }}>{suggestion.emoji}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '11px', color: 'hsl(240 5% 55%)', margin: '0 0 3px' }}>{suggestion.reason}</p>
                                <Link href={suggestion.href} style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(205,90%,60%)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  Try {suggestion.label} <ArrowRight size={11} />
                                </Link>
                              </div>
                              <button onClick={() => setDismissedSuggestion(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 40%)', fontSize: '16px', lineHeight: 1, padding: '2px', flexShrink: 0, touchAction: 'manipulation' }}>×</button>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))', borderTop: '1px solid hsl(240 6% 14%)', flexShrink: 0 }}>
          <div style={{ maxWidth: '740px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'flex-end', background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '14px', padding: '10px 12px' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message Omnia… try 'draw a sunset' · 'search for AI news' · 'build me a website'"
              rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '16px', lineHeight: '1.5', padding: 0, maxHeight: '120px', color: 'hsl(0 0% 88%)', fontFamily: 'inherit' }}
              onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }}
            />
            {inputType === 'image' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', background: 'hsl(280 80% 55% / 0.15)', border: '1px solid hsl(280 80% 55% / 0.3)', flexShrink: 0 }}>
                <ImageIcon size={12} color="hsl(280, 80%, 70%)" />
                <span style={{ fontSize: '11px', color: 'hsl(280, 80%, 70%)', whiteSpace: 'nowrap' }}>Image</span>
              </div>
            )}
            {inputType === 'search' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', background: 'hsl(160 60% 40% / 0.15)', border: '1px solid hsl(160 60% 40% / 0.3)', flexShrink: 0 }}>
                <Search size={12} color="hsl(160, 60%, 60%)" />
                <span style={{ fontSize: '11px', color: 'hsl(160, 60%, 60%)', whiteSpace: 'nowrap' }}>Web</span>
              </div>
            )}
            {inputType === 'summarise' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', background: 'hsl(38 90% 50% / 0.15)', border: '1px solid hsl(38 90% 50% / 0.3)', flexShrink: 0 }}>
                <span style={{ fontSize: '11px' }}>📋</span>
                <span style={{ fontSize: '11px', color: 'hsl(38, 90%, 65%)', whiteSpace: 'nowrap' }}>Summary</span>
              </div>
            )}
            <button
              onClick={send}
              disabled={!input.trim() || busy}
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: input.trim() && !busy ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 16%)', border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation' }}
            >
              <Send size={15} color={input.trim() && !busy ? 'white' : 'hsl(240 5% 45%)'} />
            </button>
          </div>
          {busy && (
            <p style={{ textAlign: 'center', fontSize: '11px', color: 'hsl(240 5% 45%)', marginTop: '6px' }}>
              {generatingImage ? '🎨 Generating image…' : searching ? '🔍 Searching the web…' : summarising ? '📋 Summarising…' : '⏳ Thinking…'}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .sidebar-close { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
