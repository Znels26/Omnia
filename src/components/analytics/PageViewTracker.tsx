'use client';
/**
 * PageViewTracker
 * ---------------
 * Fires a POST /api/analytics/view whenever the pathname changes.
 * Generates a session ID in sessionStorage (one per browser tab session).
 * Completely silent — no UI, no errors surfaced to the user.
 */
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId(): string {
  try {
    const key = 'omnia_sid';
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return 'unknown';
  }
}

export function PageViewTracker({ userId }: { userId?: string }) {
  const pathname  = usePathname();
  const lastSent  = useRef<string>('');

  useEffect(() => {
    // Avoid double-fire on strict-mode re-renders for the same path
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    const sessionId = getSessionId();
    fetch('/api/analytics/view', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ page: pathname, sessionId, userId }),
    }).catch(() => {});
  }, [pathname, userId]);

  return null;
}
