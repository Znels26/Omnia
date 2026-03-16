'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Pin, Trash2, Send, Sparkles, Copy, Check, ChevronDown } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

const MODES = [
  { value: 'general', label: '✨ General' },
  { value: 'productivity', label: '⚡ Productivity' },
  { value: 'writing', label: '✍️ Writing' },
  { value: 'study', label: '📚 Study' },
  { value: 'planning', label: '🎯 Planning' },
  { value: 'documents', label: '📄 Documents' },
];

const STARTERS: any = {
  general: ['Explain something to me', 'Help me brainstorm', 'Review my writing', 'Answer a question'],
  productivity: ['Help me prioritize tasks', 'Plan my day', 'Break down a project', 'Beat procrastination'],
  writing: ['Write a professional email', 'Improve this paragraph', 'Blog post outline', 'Creative writing help'],
  study: ['Explain a concept', 'Create study flashcards', 'Summarize key points', 'Quiz me on a topic'],
  planning: ['Plan a project', 'Set SMART goals', 'Create a weekly plan', 'Map out a strategy'],
  documents: ['Summarize a document', 'Extract key info', 'Analyze this content', 'Create table of contents'],
};

export function AssistantView({ profile, initialChats }: any) {
  const [chats, setChats] = useState(initialChats);
  const [activeChatId, setActiveChatId] = useState<string|null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState(profile?.assistant_mode || 'general');
  const [showModes, setShowModes] = useState(false);
  const [copied, setCopied] = useState<string|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = async (chatId: string) => {
    const res = await fetch(`/api/ai/chat/${chatId}/messages`);
    if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
  };

  const selectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    await loadMessages(chatId);
    inputRef.current?.focus();
  };

  const newChat = async () => {
    const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) });
    if (res.ok) { const { chat } = await res.json(); setChats((p: any[]) => [chat, ...p]); setActiveChatId(chat.id); setMessages([]); }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    let chatId = activeChatId;
    if (!chatId) {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, title: text.slice(0, 60) }) });
      if (!res.ok) { toast.error('Failed to create chat'); return; }
      const { chat } = await res.json();
      chatId = chat.id;
      setChats((p: any[]) => [chat, ...p]);
      setActiveChatId(chat.id);
    }
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() };
    const aiMsg = { id: `a-${Date.now()}`, role: 'assistant', content: '', created_at: new Date().toISOString() };
    setMessages(p => [...p, userMsg, aiMsg]);
    setInput('');
    setStreaming(true);
    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, content: text, mode, messages: messages.slice(-8).map((m: any) => ({ role: m.role, content: m.content })) }),
      });
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
            } catch {}
          }
        }
      }
    } catch (e: any) { if (e?.name !== 'AbortError') toast.error('Connection error'); }
    finally { setStreaming(false); }
  };

  const copyMsg = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(id); setTimeout(() => setCopied(null), 2000); toast.success('Copied!');
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    await fetch(`/api/ai/chat/${chatId}`, { method: 'DELETE' });
    setChats((p: any[]) => p.filter(c => c.id !== chatId));
    if (activeChatId === chatId) { setActiveChatId(null); setMessages([]); }
  };

  const pinChat = async (chatId: string, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/ai/chat/${chatId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_pinned: !isPinned }) });
    setChats((p: any[]) => p.map(c => c.id === chatId ? { ...c, is_pinned: !isPinned } : c));
  };

  const pinned = chats.filter((c: any) => c.is_pinned);
  const recent = chats.filter((c: any) => !c.is_pinned);

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', borderRight: '1px solid hsl(240 6% 14%)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'hsl(240 10% 4%)' }}>
        <div style={{ padding: '12px', borderBottom: '1px solid hsl(240 6% 14%)' }}>
          <button onClick={newChat} className="btn btn-primary" style={{ width: '100%', gap: '6px' }}>
            <Plus size={15} /> New Chat
          </button>
        </div>
        <div style={{ padding: '8px', borderBottom: '1px solid hsl(240 6% 14%)', position: 'relative' }}>
          <button onClick={() => setShowModes(!showModes)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', background: 'hsl(240 6% 11%)', border: 'none', cursor: 'pointer', color: 'hsl(0 0% 88%)', fontSize: '13px' }}>
            <span>{MODES.find(m => m.value === mode)?.label || '✨ General'}</span>
            <ChevronDown size={14} />
          </button>
          {showModes && (
            <div style={{ position: 'absolute', top: '100%', left: '8px', right: '8px', background: 'hsl(240 8% 9%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '10px', zIndex: 20, overflow: 'hidden' }}>
              {MODES.map(m => (
                <button key={m.value} onClick={() => { setMode(m.value); setShowModes(false); }} style={{ width: '100%', padding: '9px 12px', background: mode === m.value ? 'hsl(205 90% 48% / 0.1)' : 'transparent', border: 'none', cursor: 'pointer', color: mode === m.value ? 'hsl(205, 90%, 60%)' : 'hsl(0 0% 75%)', textAlign: 'left', fontSize: '13px' }}>
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {pinned.length > 0 && <>
            <p style={{ padding: '6px 8px 4px', fontSize: '10px', color: 'hsl(240 5% 45%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pinned</p>
            {pinned.map((c: any) => <ChatItem key={c.id} chat={c} active={activeChatId === c.id} onSelect={() => selectChat(c.id)} onPin={(e) => pinChat(c.id, c.is_pinned, e)} onDelete={(e) => deleteChat(c.id, e)} />)}
          </>}
          {recent.length > 0 && <>
            {pinned.length > 0 && <p style={{ padding: '8px 8px 4px', fontSize: '10px', color: 'hsl(240 5% 45%)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent</p>}
            {recent.map((c: any) => <ChatItem key={c.id} chat={c} active={activeChatId === c.id} onSelect={() => selectChat(c.id)} onPin={(e) => pinChat(c.id, c.is_pinned, e)} onDelete={(e) => deleteChat(c.id, e)} />)}
          </>}
          {chats.length === 0 && <div className="empty" style={{ padding: '32px 16px' }}><MessageSquare size={28} color="hsl(240 5% 35%)" /><p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)' }}>No conversations yet</p></div>}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={15} color="hsl(205, 90%, 60%)" />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>{chats.find((c: any) => c.id === activeChatId)?.title || 'New Conversation'}</span>
          <span style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', marginLeft: '4px' }}>· {mode}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '40px 20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'hsl(205 90% 48% / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={24} color="hsl(205, 90%, 60%)" /></div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>How can I help?</h2>
                <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)' }}>I'm in <strong style={{ color: 'hsl(205, 90%, 60%)' }}>{mode}</strong> mode</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '480px' }}>
                {(STARTERS[mode] || STARTERS.general).map((s: string) => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid hsl(240 6% 16%)', background: 'transparent', color: 'hsl(0 0% 75%)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}>
                    {s}
                  </button>
                ))}
              </div>
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
                  <div className={msg.role === 'user' ? 'chat-user' : 'chat-ai'} style={{ maxWidth: '82%', padding: '10px 14px', fontSize: '14px', lineHeight: 1.65 }}>
                    {msg.content ? <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p> : <span className="typing" />}
                    {msg.role === 'assistant' && msg.content && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid hsl(240 6% 20%)' }}>
                        <button onClick={() => copyMsg(msg.content, msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: 0 }}>
                          {copied === msg.id ? <><Check size={12} color="#34d399" /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid hsl(240 6% 14%)' }}>
          <div style={{ maxWidth: '740px', margin: '0 auto', display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '14px', padding: '10px 12px', transition: 'border-color 0.15s', outline: 'none' }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Message Omnia (${mode} mode)…`} rows={1} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '14px', lineHeight: '1.5', padding: 0, maxHeight: '120px', color: 'hsl(0 0% 88%)', fontFamily: 'inherit' }} onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }} />
            <button onClick={send} disabled={!input.trim() || streaming} style={{ width: '34px', height: '34px', borderRadius: '10px', background: input.trim() && !streaming ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 16%)', border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
              <Send size={15} color={input.trim() && !streaming ? 'white' : 'hsl(240 5% 45%)'} />
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'hsl(240 5% 40%)', marginTop: '6px' }}>Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  );
}

function ChatItem({ chat, active, onSelect, onPin, onDelete }: any) {
  return (
    <div onClick={onSelect} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: active ? 'hsl(205 90% 48% / 0.1)' : 'transparent', transition: 'background 0.15s' }} className="chat-list-item">
      <MessageSquare size={13} color={active ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 50%)'} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'hsl(205, 90%, 70%)' : 'hsl(240 5% 70%)' }}>{chat.title}</span>
      <div style={{ display: 'flex', gap: '2px', opacity: 0 }} className="chat-actions">
        <button onClick={onPin} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: chat.is_pinned ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 50%)', display: 'flex' }}><Pin size={11} /></button>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'hsl(240 5% 50%)', display: 'flex' }}><Trash2 size={11} /></button>
      </div>
    </div>
  );
}
