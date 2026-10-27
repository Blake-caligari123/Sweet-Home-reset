// Keep web players on the latest deploy. The service worker only looks for a new version when a
// page loads, so an open tab or a Home Screen app resumed from the background would keep playing
// an old build. Here we also check every few minutes and whenever the game comes back to the
// front, and swap to the new build at a calm moment: just opened or resumed, or when it goes to
// the background (the game saves on hide), never in the middle of play.
export const CHECK_EVERY_MS = 10 * 60 * 1000;
/** Within this long of the game opening or coming back to the front, reloading costs nothing. */
export const FRESH_MS = 20_000;
/** Give the save-on-hide a moment to land before swapping builds in the background. */
export const HIDDEN_RELOAD_DELAY_MS = 1500;

export function reloadNow(state: { hidden: boolean; msSinceShown: number }) {
  return state.hidden || state.msSinceShown < FRESH_MS;
}

export function keepUpdated() {
  let shownAt = performance.now();
  let pending = false;
  const reload = () => window.location.reload();
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedReload() {
        pending = true;
        if (document.hidden) window.setTimeout(reload, HIDDEN_RELOAD_DELAY_MS);
        else if (reloadNow({ hidden: false, msSinceShown: performance.now() - shownAt })) reload();
      },
      onRegisteredSW(_url, reg) {
        if (!reg) return;
        const check = () => { if (navigator.onLine !== false) reg.update().catch(() => undefined); };
        window.setInterval(check, CHECK_EVERY_MS);
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) { if (pending) window.setTimeout(reload, HIDDEN_RELOAD_DELAY_MS); return; }
          shownAt = performance.now();
          check();
        });
      }
    });
  });
}
