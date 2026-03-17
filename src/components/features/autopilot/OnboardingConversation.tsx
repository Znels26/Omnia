'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface OnboardingConversationProps {
  onComplete: (persona: string) => void;
}

const QUESTIONS = [
  "What do you do for work, or what are you trying to achieve?",
  "Who are your main clients or who do you want to reach?",
  "What are your top 3 goals right now?",
  "What does a perfect week look like for you?",
  "Which tasks do you hate doing most?",
  "What time do you wake up each day?",
  "Which platforms and tools do you use daily?",
  "How do you prefer to receive updates — app, email, or both?",
  "What decisions can Omnia make without checking with you first?",
  "What should Omnia never do without your permission?",
];

const WELCOME_MESSAGE =
  "Hi! I'm going to ask you 10 quick questions to set up your Autopilot. This takes about 2 minutes and means Omnia can start working for you immediately. Ready? Let's go.";

export default function OnboardingConversation({ onComplete }: OnboardingConversationProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
    { role: 'assistant', content: `Question 1 of 10: ${QUESTIONS[0]}` },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentStep]);

  async function handleSend() {
    const answer = currentAnswer.trim();
    if (!answer || loading || done) return;

    const nextStep = currentStep + 1;
    const updatedAnswers = { ...answers, [currentStep]: answer };

    setCurrentAnswer('');
    setAnswers(updatedAnswers);
    setMessages(prev => [...prev, { role: 'user', content: answer }]);
    setLoading(true);

    try {
      const res = await fetch('/api/autopilot/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: updatedAnswers, step: nextStep }),
      });

      const data = res.ok ? await res.json().catch(() => ({})) : {};

      if (nextStep >= QUESTIONS.length) {
        // All done
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content:
              data.message ??
              "Amazing — that's everything I need! I'm setting up your Autopilot now. You'll start seeing personalised actions and opportunities within the next 24 hours.",
          },
        ]);
        setDone(true);
        setCurrentStep(nextStep);

        // Short delay then call onComplete
        setTimeout(() => {
          onComplete(data.persona ?? 'The Starter');
        }, 2200);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content:
              data.message
                ? `${data.message}\n\nQuestion ${nextStep + 1} of 10: ${QUESTIONS[nextStep]}`
                : `Question ${nextStep + 1} of 10: ${QUESTIONS[nextStep]}`,
          },
        ]);
        setCurrentStep(nextStep);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Question ${nextStep + 1} of 10: ${QUESTIONS[nextStep] ?? ''}` },
      ]);
      setCurrentStep(nextStep);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const progress = Math.min((currentStep / QUESTIONS.length) * 100, 100);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .onboarding-bubble {
          animation: fade-in-up 0.25s ease forwards;
        }
        @keyframes typing-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .typing-dot { animation: typing-dot 1.2s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: 680,
        background: 'hsl(240 10% 6%)',
        border: '1px solid hsl(205 90% 48% / 0.3)',
        borderRadius: 16,
        boxShadow: '0 0 60px hsl(205 90% 48% / 0.08), 0 24px 48px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100dvh - 32px)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid hsl(240 6% 12%)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'hsl(0 0% 90%)' }}>Setting up Autopilot</p>
            <p style={{ margin: 0, fontSize: 12, color: 'hsl(240 5% 50%)' }}>
              {done ? 'Complete!' : `Question ${Math.min(currentStep + 1, QUESTIONS.length)} of ${QUESTIONS.length}`}
            </p>
          </div>
          {/* Progress bar */}
          <div style={{ flex: 1, margin: '0 16px' }}>
            <div style={{
              height: 4, borderRadius: 999,
              background: 'hsl(240 6% 16%)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                borderRadius: 999,
                width: `${progress}%`,
                background: 'hsl(205 90% 48%)',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'hsl(240 5% 50%)', flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
            {Math.round(progress)}%
          </span>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className="onboarding-bubble"
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'hsl(240 8% 12%)'
                  : 'hsl(205 90% 48% / 0.1)',
                border: `1px solid ${msg.role === 'user' ? 'hsl(240 6% 18%)' : 'hsl(205 90% 48% / 0.2)'}`,
                fontSize: 14,
                lineHeight: 1.55,
                color: 'hsl(0 0% 88%)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="onboarding-bubble" style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '16px 16px 16px 4px',
                background: 'hsl(205 90% 48% / 0.1)',
                border: '1px solid hsl(205 90% 48% / 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                {[0, 1, 2].map(n => (
                  <span
                    key={n}
                    className="typing-dot"
                    style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'hsl(205 90% 55%)',
                      display: 'inline-block',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!done && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid hsl(240 6% 12%)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={loading}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid hsl(240 6% 18%)',
                background: 'hsl(240 10% 4%)',
                color: 'hsl(0 0% 90%)',
                fontSize: 14,
                lineHeight: 1.5,
                fontFamily: 'inherit',
                outline: 'none',
                maxHeight: 120,
                overflowY: 'auto',
                transition: 'border-color 0.15s',
                width: '100%',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'hsl(205 90% 48% / 0.5)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'hsl(240 6% 18%)'; }}
            />
            <button
              onClick={handleSend}
              disabled={!currentAnswer.trim() || loading}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: currentAnswer.trim() && !loading ? 'hsl(205 90% 48%)' : 'hsl(240 6% 16%)',
                color: currentAnswer.trim() && !loading ? '#fff' : 'hsl(240 5% 40%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentAnswer.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, color 0.15s',
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        )}

        {/* Done state footer */}
        {done && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid hsl(240 6% 12%)',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: 'hsl(240 5% 50%)' }}>
              Setting up your Autopilot...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
