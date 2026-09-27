/*
 * One-time handover from the old auto-updating service worker.
 *
 * Tabs opened under the old worker run old page code that never asks a waiting
 * worker to take over, so they would stay on the old version until every tab
 * was closed. The first time this worker installs over one of those, it takes
 * over straight away (the old page code then reloads itself, exactly as before).
 * After that, the page decides when to update (src/services/appUpdate.js).
 */
const HANDOVER_MARKER = 'gb-sw-prompt-mode-v1';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    if (await caches.has(HANDOVER_MARKER)) return;
    await caches.open(HANDOVER_MARKER);
    if (self.registration.active) self.skipWaiting();
  })());
});
