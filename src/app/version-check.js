import { syncNotices } from './notice-priority.js';
/** Version manifests contain no personal data. A visible tab checks at most every minute. */
export function installVersionCheck(app) {
  if (typeof __BUILD_ID__ === 'undefined') return;
  let checkedAt = 0,
    pending = false,
    updateAvailable = false;
  const banner = document.createElement('aside');
  banner.className = 'notice update-notice';
  banner.hidden = true;
  banner.setAttribute('role', 'status');
  const text = document.createElement('p');
  text.textContent = 'Hay una nueva versión. Puedes actualizar cuando hayas terminado tu ronda.';
  const button = document.createElement('button');
  button.className = 'button button-secondary';
  button.textContent = 'Actualizar la app';
  banner.append(text, button);
  document.querySelector('#main').before(banner);
  button.addEventListener('click', async () => {
    if (app.hasOpenRound() && (await app.requestRoundExit('home')) !== 'exit') return;
    if (!app.activatePWAUpdate?.()) location.reload();
  });
  async function check() {
    if (
      document.hidden ||
      !navigator.onLine ||
      pending ||
      updateAvailable ||
      Date.now() - checkedAt < 60000
    )
      return;
    checkedAt = Date.now();
    pending = true;
    try {
      const response = await fetch(new URL('./version.json', document.baseURI), {
        cache: 'no-store',
      });
      if (!response.ok) return;
      const manifest = await response.json();
      if (typeof manifest.buildId === 'string' && manifest.buildId !== __BUILD_ID__) {
        updateAvailable = true;
        app.updateAvailable = true;
        syncNotices(app);
      }
    } catch {
      /* Offline play remains available; navigation has its own retry screen. */
    } finally {
      pending = false;
    }
  }
  document.addEventListener('visibilitychange', check);
  window.setTimeout(check, 5000);
  window.setInterval(check, 15 * 60 * 1000);
}
