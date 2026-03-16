const CACHE = 'omnia-v1';
const PRECACHE = ['/dashboard', '/assistant', '/planner'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Push notification handler ─────────────────────────────────────────────────
// Handles FCM messages delivered via Web Push (app closed or backgrounded).
// Firebase FCM V1 API sends a webpush payload; we parse it and show the notification.
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch {}

  // FCM V1 packs fields under notification + data
  const notif   = data.notification ?? {};
  const extra   = data.data         ?? {};
  const title   = notif.title  || extra.title || 'Omnia';
  const body    = notif.body   || extra.body  || '';
  const url     = extra.url    || notif.click_action || '/dashboard';
  const icon    = notif.icon   || '/icon-192.png';
  const badge   = '/icon-192.png';

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data:               { url },
      requireInteraction: false,
      vibrate:            [100, 50, 100],
    })
  );
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || '/dashboard';

  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(wins => {
        // Focus existing Omnia tab if open
        const match = wins.find(w => w.url.startsWith(self.location.origin));
        if (match) {
          match.focus();
          return match.navigate(targetUrl);
        }
        return clients.openWindow(targetUrl);
      })
  );
});

// ── Fetch cache handler ───────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip: non-GET, API routes, auth, Supabase, external
  if (
    e.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase') ||
    url.hostname !== self.location.hostname
  ) return;

  // Network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
