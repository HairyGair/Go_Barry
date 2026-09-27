/**
 * App update handling for the PWA service worker.
 *
 * The browser only looks for a new service worker when a page is loaded, so a
 * display or dashboard left open for days never picks up a deploy. We poll for
 * updates, then apply them straight away when it is safe to reload (nothing
 * being typed, no dialog open, not mid-wizard). Otherwise a small prompt lets
 * the supervisor refresh when they are ready, and we keep retrying quietly.
 */

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const SAFE_RETRY_MS = 30 * 1000;

let applyUpdate = null;
let updateReady = false;
let retryTimer = null;
let toastEl = null;

// Reloading here would throw away work in progress
const isSafeToReload = () => {
  const path = window.location.pathname;
  if (path.startsWith('/breakdown-guide')) return false;
  if (document.querySelector('[role="dialog"], [aria-modal="true"], .modal-overlay')) return false;
  const active = document.activeElement;
  if (active && active.matches?.('input, textarea, select, [contenteditable="true"]')) return false;
  return true;
};

const reloadNow = () => {
  if (applyUpdate) applyUpdate(true);
  else window.location.reload();
};

const showToast = () => {
  if (toastEl) return;
  toastEl = document.createElement('div');
  toastEl.className = 'app-update-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.innerHTML = `
    <span class="app-update-toast__dot" aria-hidden="true"></span>
    <span class="app-update-toast__text">A new version of Go BARRY is ready.</span>
    <button type="button" class="app-update-toast__btn">Refresh</button>
  `;
  toastEl.querySelector('button').addEventListener('click', reloadNow);
  document.body.appendChild(toastEl);
};

const tryApply = () => {
  if (!updateReady) return;
  if (isSafeToReload()) {
    reloadNow();
    return;
  }
  showToast();
  clearTimeout(retryTimer);
  retryTimer = setTimeout(tryApply, SAFE_RETRY_MS);
};

export const initAppUpdates = async () => {
  if (!('serviceWorker' in navigator)) return;
  const { registerSW } = await import('virtual:pwa-register');

  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
      tryApply();
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) registration.update().catch(() => {});
      };
      setInterval(check, CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });

  // If a new worker takes control by any other route (e.g. the one-time
  // handover in public/sw-transition.js) this page is running old code whose
  // lazy chunks may no longer exist on the server - reload when safe
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    updateReady = true;
    tryApply();
  });

  // Route changes are a natural moment to pick up a pending update
  window.addEventListener('popstate', tryApply);
};
