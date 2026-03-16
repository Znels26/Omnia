'use client';
/**
 * NotificationPrompt
 * ------------------
 * Shown once after login if the user hasn't been asked yet (or dismissed > 7 days ago).
 * Requests browser notification permission, gets the FCM registration token via
 * the Firebase Messaging SDK, then saves it to Supabase via /api/push/subscribe.
 *
 * The component uses a custom SW registration (existing /sw.js) so we don't need
 * a separate firebase-messaging-sw.js.
 *
 * Required env vars (all NEXT_PUBLIC_):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_SENDER_ID
 *   NEXT_PUBLIC_VAPID_KEY
 */
import { useState, useEffect } from 'react';
import { Bell, X, BellOff } from 'lucide-react';

const STORAGE_KEY    = 'omnia_push_prompt';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function NotificationPrompt() {
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState<'idle' | 'success' | 'denied'>('idle');

  useEffect(() => {
    // Don't run on server or if Notifications API unavailable
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Already granted or denied — no prompt needed
    const perm = Notification.permission;
    if (perm === 'granted' || perm === 'denied') return;

    // Check if dismissed recently
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { dismissedAt } = JSON.parse(stored);
        if (Date.now() - dismissedAt < DISMISS_TTL_MS) return;
      }
    } catch {}

    // Delay prompt by 3 seconds so the dashboard loads first
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
    } catch {}
    setShow(false);
  };

  const handleAllow = async () => {
    setLoading(true);
    try {
      // 1. Request browser permission
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('denied');
        setTimeout(() => setShow(false), 2000);
        return;
      }

      // 2. Dynamically import Firebase Messaging (client-only)
      const { initializeApp, getApps } = await import('firebase/app');
      const { getMessaging, getToken }  = await import('firebase/messaging');

      const firebaseConfig = {
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      };

      const app       = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const messaging = getMessaging(app);

      // 3. Get FCM token — use existing sw.js so no separate firebase-messaging-sw.js needed
      let swReg: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      const fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg,
      });

      if (!fcmToken) throw new Error('No token returned');

      // 4. Save token to Supabase
      const deviceHint = getDeviceHint();
      const res = await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: fcmToken, deviceHint }),
      });

      if (!res.ok) throw new Error('Failed to save token');

      // 5. Mark as done
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ grantedAt: Date.now() })); } catch {}
      setStatus('success');
      setTimeout(() => setShow(false), 2000);

    } catch (err) {
      console.error('[NotificationPrompt] error:', err);
      // Still dismiss so we don't pester the user
      dismiss();
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position:     'fixed',
        bottom:       '80px',   // above mobile bottom nav
        left:         '50%',
        transform:    'translateX(-50%)',
        zIndex:       200,
        width:        'min(380px, calc(100vw - 32px))',
        background:   'hsl(240 10% 8%)',
        border:       '1px solid hsl(240 6% 16%)',
        borderRadius: '16px',
        padding:      '20px',
        boxShadow:    '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px hsl(240 6% 12%)',
        animation:    'slideUpFade 0.3s ease',
      }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Close */}
      <button
        onClick={dismiss}
        style={{
          position:   'absolute', top: '12px', right: '12px',
          background: 'none', border: 'none', cursor: 'pointer',
          color:      'hsl(240 5% 45%)', display: 'flex', padding: '4px',
        }}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      {status === 'success' ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
          <p style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 4px' }}>You're all set!</p>
          <p style={{ fontSize: '13px', color: 'hsl(240 5% 55%)', margin: 0 }}>
            Push notifications enabled.
          </p>
        </div>
      ) : status === 'denied' ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <BellOff size={24} color="hsl(240 5% 45%)" style={{ marginBottom: '8px' }} />
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px' }}>Notifications blocked</p>
          <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', margin: 0 }}>
            Enable them in your browser settings.
          </p>
        </div>
      ) : (
        <>
          {/* Icon + heading */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background:   'hsl(205 90% 48% / 0.15)',
              border:       '1px solid hsl(205 90% 48% / 0.25)',
              display:      'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={18} color="hsl(205, 90%, 60%)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 4px' }}>
                Enable notifications
              </p>
              <p style={{ fontSize: '12.5px', color: 'hsl(240 5% 55%)', margin: 0, lineHeight: 1.5 }}>
                Get reminders, invoice alerts and your morning briefing pushed straight to your device.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAllow}
              disabled={loading}
              style={{
                flex:         1,
                padding:      '11px',
                borderRadius: '10px',
                background:   loading ? 'hsl(205 90% 48% / 0.5)' : 'hsl(205, 90%, 48%)',
                border:       'none',
                cursor:       loading ? 'not-allowed' : 'pointer',
                color:        'white',
                fontWeight:   600,
                fontSize:     '14px',
                transition:   'background 0.15s',
              }}
            >
              {loading ? 'Enabling…' : 'Allow'}
            </button>
            <button
              onClick={dismiss}
              style={{
                padding:      '11px 16px',
                borderRadius: '10px',
                background:   'transparent',
                border:       '1px solid hsl(240 6% 20%)',
                cursor:       'pointer',
                color:        'hsl(240 5% 58%)',
                fontWeight:   500,
                fontSize:     '14px',
                whiteSpace:   'nowrap',
              }}
            >
              Maybe later
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Best-effort device name string for the subscriptions table */
function getDeviceHint(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua))    return 'iPhone';
  if (/iPad/.test(ua))      return 'iPad';
  if (/Android/.test(ua))   return 'Android';
  if (/Mac/.test(ua))       return 'Mac';
  if (/Windows/.test(ua))   return 'Windows';
  return 'Browser';
}
