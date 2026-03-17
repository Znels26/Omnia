'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface ImportProgressProps {
  platform: string;
  onComplete: (stats: any) => void;
}

const MESSAGES = [
  'Reading your conversation history…',
  'Analysing your conversations with AI…',
  'Found fitness & health discussions…',
  'Found finance & money conversations…',
  'Identifying your goals and ambitions…',
  'Extracting tasks and to-do items…',
  'Learning your habits and routines…',
  'Building your personal profile…',
  'Creating your tasks in Planner…',
  'Updating your AI memory…',
  'Configuring your Autopilot…',
  'Almost done…',
];

const MESSAGE_INTERVAL_MS = 800;

export function ImportProgress({ platform, onComplete }: ImportProgressProps) {
  const [completedMessages, setCompletedMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>(MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  const indexRef = useRef(0);

  // Blink the cursor
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Step through messages
  useEffect(() => {
    const total = MESSAGES.length;

    const advance = () => {
      indexRef.current += 1;
      const idx = indexRef.current;

      if (idx >= total) return;

      const prevMsg = MESSAGES[idx - 1];
      setCompletedMessages((prev) => [...prev, prevMsg]);
      setCurrentMessage(MESSAGES[idx]);
      // Progress goes from ~8% at first step to 95% at last
      setProgress(Math.round(((idx + 1) / total) * 95));
    };

    // Set initial progress for message 0
    setProgress(Math.round((1 / MESSAGES.length) * 95));

    const id = setInterval(() => {
      advance();
      if (indexRef.current >= MESSAGES.length - 1) {
        clearInterval(id);
      }
    }, MESSAGE_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  const platformLabel =
    platform === 'chatgpt'
      ? 'ChatGPT'
      : platform === 'claude'
      ? 'Claude'
      : platform === 'gemini'
      ? 'Gemini'
      : 'Text';

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <style>{`
        @keyframes ip-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(205 90% 48% / 0), 0 0 20px hsl(205 90% 48% / 0.25); }
          50%       { box-shadow: 0 0 0 8px hsl(205 90% 48% / 0.08), 0 0 32px hsl(205 90% 48% / 0.45); }
        }
        @keyframes ip-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ip-bar-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .ip-logo {
          animation: ip-glow-pulse 2.4s ease-in-out infinite;
        }
        .ip-msg-enter {
          animation: ip-fadein 0.3s ease both;
        }
        .ip-progress-fill {
          background: linear-gradient(90deg, hsl(205 90% 40%), hsl(205 90% 60%), hsl(205 90% 40%));
          background-size: 200% 100%;
          animation: ip-bar-shimmer 2s linear infinite;
          transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Logo with glow */}
      <div
        className="ip-logo"
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'hsl(205 90% 48% / 0.12)',
          border: '1.5px solid hsl(205 90% 48% / 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <Sparkles size={28} color="hsl(205 90% 60%)" />
      </div>

      {/* Headline */}
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'hsl(240 5% 95%)',
          margin: '0 0 6px',
          textAlign: 'center',
        }}
      >
        Importing your history
      </h2>
      <p
        style={{
          fontSize: '13px',
          color: 'hsl(240 5% 50%)',
          margin: '0 0 32px',
          textAlign: 'center',
        }}
      >
        Analysing your {platformLabel} conversations…
      </p>

      {/* Progress bar */}
      <div style={{ width: '100%', marginBottom: '28px' }}>
        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '999px',
            background: 'hsl(240 6% 12%)',
            overflow: 'hidden',
          }}
        >
          <div
            className="ip-progress-fill"
            style={{
              height: '100%',
              borderRadius: '999px',
              width: `${progress}%`,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'hsl(240 5% 38%)' }}>Processing</span>
          <span style={{ fontSize: '11px', color: 'hsl(240 5% 38%)' }}>{progress}%</span>
        </div>
      </div>

      {/* Message history + current message */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginBottom: '16px',
          minHeight: '120px',
        }}
      >
        {completedMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: Math.max(0.2, 0.5 - (completedMessages.length - 1 - i) * 0.08),
              transition: 'opacity 0.4s',
            }}
          >
            <CheckCircle2
              size={13}
              color="hsl(142 70% 55%)"
              style={{ flexShrink: 0 }}
            />
            <span style={{ fontSize: '13px', color: 'hsl(240 5% 50%)' }}>{msg}</span>
          </div>
        ))}

        {/* Current message with blinking cursor */}
        <div
          key={currentMessage}
          className="ip-msg-enter"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              border: '2px solid hsl(205 90% 48%)',
              flexShrink: 0,
              background: 'transparent',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'hsl(240 5% 85%)',
            }}
          >
            {currentMessage}
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '13px',
                background: 'hsl(205 90% 60%)',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                opacity: cursorVisible ? 1 : 0,
                transition: 'opacity 0.1s',
              }}
            />
          </span>
        </div>
      </div>

      {/* Footer note */}
      <p
        style={{
          fontSize: '12px',
          color: 'hsl(240 5% 35%)',
          textAlign: 'center',
          margin: '8px 0 0',
        }}
      >
        This usually takes 15–30 seconds
      </p>
    </div>
  );
}
