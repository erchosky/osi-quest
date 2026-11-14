/* SPDX-License-Identifier: MIT */
// These constants are injected by the production builder.
const BUILD = __PWA_BUILD__;
const FILES = __PWA_FILES__;
const ROOT = new URL('./', self.location.href);
const PREFIX = 'osi-quest:' + ROOT.href + ':';
const CACHE = PREFIX + BUILD;
const ownWindows = async () =>
  (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter((client) =>
    client.url.startsWith(ROOT.href),
  );
async function cleanup() {
  // Old windows may still reference old module hashes. Never evict their cache.
  if (self.registration.waiting || self.registration.installing || (await ownWindows()).length > 1)
    return;
  for (const key of await caches.keys())
    if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
}
self.addEventListener('install', (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE);
        await cache.addAll(
          FILES.map((file) => new Request(new URL(file, ROOT), { cache: 'reload' })),
        );
      } catch (error) {
        await caches.delete(CACHE);
        throw error;
      }
    })(),
  ),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await cleanup();
    })(),
  ),
);
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEANUP') event.waitUntil(cleanup());
  if (event.data?.type === 'ACTIVATE')
    event.waitUntil(
      (async () => {
        if ((await ownWindows()).length > 1) {
          event.source?.postMessage({ type: 'UPDATE_BLOCKED' });
          return;
        }
        await self.skipWaiting();
      })(),
    );
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== ROOT.origin ||
    !url.href.startsWith(ROOT.href) ||
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('/sw.js')
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const key =
        event.request.mode === 'navigate'
          ? new URL('index.html', ROOT)
          : new URL(url.pathname, ROOT.origin);
      return (await cache.match(key)) || fetch(event.request);
    })(),
  );
});
