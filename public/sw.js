/**
 * Service Worker — PCWE2026 ファンガイド
 *
 * オフライン対応 + キャッシュ戦略。
 * - HTML: Network First（最新を優先、オフライン時はキャッシュ）
 * - 画像（thumbnails）: Cache First（変わらない）
 * - JS/CSS/JSON: Stale While Revalidate
 *
 * ホーム画面に追加されたユーザーが、会場でオフラインでも基本機能を使えることが目的。
 */

// CACHE_VERSION はビルド時に scripts/build-sw.ts で git commit hash に置換される
const CACHE_VERSION = '923652abb1e6';
const STATIC_CACHE = `pcwe2026-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pcwe2026-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `pcwe2026-images-${CACHE_VERSION}`;

// オフラインで最低限機能するためのプリキャッシュ
const PRECACHE_URLS = [
  '/',
  '/plan',
  '/about',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.endsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 同一オリジンのみキャッシュ
  if (url.origin !== self.location.origin) return;

  // 画像（thumbnails）: Cache First
  if (url.pathname.startsWith('/thumbnails/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // HTML: Network First（最新優先）
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // その他（JS/CSS/JSON 等）: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached !== undefined) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Image not available offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached !== undefined) return cached;
    // 最低限のオフラインフォールバック
    const fallback = await cache.match('/');
    if (fallback !== undefined) return fallback;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await networkPromise) ?? new Response('Resource not available', { status: 503 });
}
