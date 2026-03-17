'use client';

import { useState, useRef, useCallback } from 'react';
import { MessageSquare, Brain, Sparkles, FileText, Upload, X } from 'lucide-react';
import { ImportProgress } from './ImportProgress';
import { ImportReveal } from './ImportReveal';

type Platform = 'chatgpt' | 'claude' | 'gemini' | 'text';
type Step = 'select' | 'uploading' | 'processing' | 'complete';

interface MemoryImportProps {
  onComplete?: (stats: any) => void;
  compact?: boolean;
}

const PLATFORMS: {
  id: Platform;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    icon: MessageSquare,
    color: 'hsl(142 70% 55%)',
    bg: 'hsl(142 70% 55% / 0.1)',
    border: 'hsl(142 70% 55% / 0.3)',
  },
  {
    id: 'claude',
    label: 'Claude',
    icon: Brain,
    color: 'hsl(38 95% 60%)',
    bg: 'hsl(38 95% 60% / 0.1)',
    border: 'hsl(38 95% 60% / 0.3)',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    icon: Sparkles,
    color: 'hsl(205 90% 60%)',
    bg: 'hsl(205 90% 60% / 0.1)',
    border: 'hsl(205 90% 60% / 0.3)',
  },
  {
    id: 'text',
    label: 'Plain Text',
    icon: FileText,
    color: 'hsl(240 5% 55%)',
    bg: 'hsl(240 5% 55% / 0.1)',
    border: 'hsl(240 5% 55% / 0.3)',
  },
];

export function MemoryImport({ onComplete, compact }: MemoryImportProps) {
  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [platform, setPlatform] = useState<Platform>('chatgpt');
  const [dragOver, setDragOver] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform)!;
  const canSubmit = platform === 'text' ? pasteText.trim().length > 0 : file !== null;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] ?? null;
    setFile(chosen);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setStep('uploading');

    try {
      let response: Response;

      if (platform === 'text') {
        response = await fetch('/api/import/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pasteText, platform }),
        });
      } else {
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('platform', platform);
        response = await fetch('/api/import/history', {
          method: 'POST',
          body: formData,
        });
      }

      setStep('processing');

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Import failed. Please try again.');
      }

      const result = await response.json();
      const importedStats = result.stats ?? result;
      setStats(importedStats);
      setStep('complete');
      onComplete?.(importedStats);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
      setStep('select');
    }
  };

  const platformLabel =
    platform === 'chatgpt'
      ? 'ChatGPT'
      : platform === 'claude'
      ? 'Claude'
      : platform === 'gemini'
      ? 'Gemini'
      : 'text';

  // Processing / uploading: show ImportProgress
  if (step === 'uploading' || step === 'processing') {
    return (
      <ImportProgress
        platform={platform}
        onComplete={(s) => {
          setStats(s);
          setStep('complete');
          onComplete?.(s);
        }}
      />
    );
  }

  // Complete: show ImportReveal
  if (step === 'complete' && stats) {
    return (
      <ImportReveal
        stats={stats}
        platform={platformLabel}
        onDismiss={() => setStep('select')}
      />
    );
  }

  return (
    <div
      style={{
        maxWidth: compact ? '100%' : '600px',
        margin: '0 auto',
        padding: compact ? '0' : '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      <style>{`
        @keyframes mi-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mi-wrap { animation: mi-fadein 0.35s ease both; }
        .mi-platform-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 14px 10px;
          border-radius: 12px;
          background: hsl(240 8% 7%);
          border: 1.5px solid hsl(240 6% 14%);
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
          user-select: none;
        }
        .mi-platform-card:hover {
          border-color: hsl(240 6% 22%);
          background: hsl(240 8% 9%);
        }
        .mi-platform-card.active {
          border-color: hsl(205 90% 48%) !important;
          box-shadow: 0 0 0 3px hsl(205 90% 48% / 0.18);
        }
        .mi-dropzone {
          border-radius: 12px;
          border: 2px dashed hsl(240 6% 18%);
          background: hsl(240 8% 6%);
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s;
        }
        .mi-dropzone.over {
          border-color: hsl(205 90% 48%);
          background: hsl(205 90% 48% / 0.06);
        }
        .mi-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 24px;
          border-radius: 10px;
          background: hsl(205 90% 48%);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.18s, opacity 0.18s;
          letter-spacing: 0.01em;
        }
        .mi-btn-primary:hover:not(:disabled) { background: hsl(205 90% 42%); }
        .mi-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .mi-textarea {
          width: 100%;
          min-height: 160px;
          background: hsl(240 8% 6%);
          border: 1.5px solid hsl(240 6% 14%);
          border-radius: 10px;
          color: hsl(240 5% 85%);
          font-size: 13px;
          padding: 14px;
          resize: vertical;
          outline: none;
          font-family: inherit;
          transition: border-color 0.18s;
          box-sizing: border-box;
        }
        .mi-textarea:focus { border-color: hsl(205 90% 48% / 0.6); }
        .mi-textarea::placeholder { color: hsl(240 5% 38%); }
      `}</style>

      <div className="mi-wrap">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'hsl(205 90% 48% / 0.12)',
              border: '1.5px solid hsl(205 90% 48% / 0.25)',
              marginBottom: '16px',
            }}
          >
            <Brain size={26} color="hsl(205 90% 60%)" />
          </div>
          <h1
            style={{
              fontSize: compact ? '20px' : '24px',
              fontWeight: 700,
              margin: '0 0 8px',
              color: 'hsl(240 5% 95%)',
              lineHeight: 1.2,
            }}
          >
            Import Your Conversation History
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'hsl(240 5% 52%)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Omnia instantly learns everything about you from your previous AI conversations.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'hsl(0 80% 50% / 0.1)',
              border: '1px solid hsl(0 80% 50% / 0.25)',
              color: 'hsl(0 80% 70%)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <X size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Platform selector */}
      <div className="mi-wrap" style={{ animationDelay: '0.05s' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.07em',
            color: 'hsl(240 5% 42%)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            margin: '0 0 10px',
          }}
        >
          Select your platform
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const active = platform === p.id;
            return (
              <button
                key={p.id}
                className={`mi-platform-card${active ? ' active' : ''}`}
                onClick={() => {
                  setPlatform(p.id);
                  setFile(null);
                }}
                aria-pressed={active}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: active ? p.bg : 'hsl(240 6% 11%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.18s',
                  }}
                >
                  <Icon size={18} color={active ? p.color : 'hsl(240 5% 45%)'} />
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'hsl(240 5% 90%)' : 'hsl(240 5% 50%)',
                    transition: 'color 0.18s',
                  }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input area */}
      <div className="mi-wrap" style={{ animationDelay: '0.1s' }}>
        {platform === 'text' ? (
          <>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.07em',
                color: 'hsl(240 5% 42%)',
                textTransform: 'uppercase',
                margin: '0 0 10px',
              }}
            >
              Paste your conversations
            </p>
            <textarea
              className="mi-textarea"
              placeholder="Paste your conversations here…"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.07em',
                color: 'hsl(240 5% 42%)',
                textTransform: 'uppercase',
                margin: '0 0 10px',
              }}
            >
              Upload your export file
            </p>
            <div
              className={`mi-dropzone${dragOver ? ' over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.zip"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {file ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'hsl(205 90% 48% / 0.1)',
                      border: '1px solid hsl(205 90% 48% / 0.25)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                    }}
                  >
                    <FileText size={16} color="hsl(205 90% 60%)" />
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'hsl(205 90% 70%)',
                        fontWeight: 500,
                      }}
                    >
                      {file.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        marginLeft: '4px',
                      }}
                      aria-label="Remove file"
                    >
                      <X size={14} color="hsl(240 5% 50%)" />
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: 'hsl(240 5% 45%)', margin: 0 }}>
                    Click to change file
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'hsl(240 6% 11%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <Upload size={20} color="hsl(240 5% 45%)" />
                  </div>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'hsl(240 5% 75%)',
                      margin: 0,
                    }}
                  >
                    Drop your {platformLabel} export file here
                  </p>
                  <p style={{ fontSize: '12px', color: 'hsl(240 5% 42%)', margin: 0 }}>
                    or click to browse
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'hsl(240 5% 35%)',
                      margin: '4px 0 0',
                    }}
                  >
                    Accepts .json and .zip files
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Submit */}
      <div className="mi-wrap" style={{ animationDelay: '0.15s' }}>
        <button
          className="mi-btn-primary"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Import and Learn →
        </button>
        <p
          style={{
            fontSize: '11px',
            color: 'hsl(240 5% 38%)',
            textAlign: 'center',
            margin: '12px 0 0',
            lineHeight: 1.5,
          }}
        >
          Your data never leaves Omnia. We process your history to personalise your experience.
        </p>
      </div>
    </div>
  );
}
