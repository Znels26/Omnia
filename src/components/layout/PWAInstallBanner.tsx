'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Share2 } from 'lucide-react';

export function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window.navigator as any).standalone) return;
    // Already dismissed
    if (localStorage.getItem('pwa-dismissed')) return;

    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);

    if (isIOS) {
      setPlatform('ios');
      setTimeout(() => setVisible(true), 3000);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa-dismissed', '1');
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible || !platform) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 24px)',
      maxWidth: '380px',
      background: 'hsl(240 10% 8%)',
      border: '1px solid hsl(205 90% 48% / 0.3)',
      borderRadius: '14px',
      padding: '12px 14px',
      zIndex: 80,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      {/* Icon */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
        background: 'hsl(205 90% 48% / 0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Sparkles size={17} color="hsl(205,90%,60%)" />
      </div>

      {/* Text + action */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 3px', color: 'hsl(0 0% 90%)' }}>
          Add Omnia to your home screen
        </p>
        {platform === 'ios' ? (
          <p style={{ fontSize: '12px', color: 'hsl(240 5% 55%)', margin: 0, lineHeight: 1.5 }}>
            Tap <Share2 size={11} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 1px' }} />
            {' '}<strong style={{ color: 'hsl(240 5% 70%)' }}>Share</strong>
            {' '}then{' '}
            <strong style={{ color: 'hsl(240 5% 70%)' }}>"Add to Home Screen"</strong>
          </p>
        ) : (
          <button
            onClick={install}
            style={{
              marginTop: '5px', padding: '5px 12px', borderRadius: '7px',
              background: 'hsl(205, 90%, 48%)', border: 'none',
              cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600,
            }}
          >
            Install
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'hsl(240 5% 45%)', padding: '4px', display: 'flex', flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
