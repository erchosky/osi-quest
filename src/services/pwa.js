import { backupWorkerURL } from '../components/dom-renderer.js';
/** Installation is optional; a failed cache never blocks studying online. */
export function installPWA(app) {
  const status = document.querySelector('#offline-status'),
    button = document.querySelector('#install-app');
  let prompt = null,
    registration = null,
    reloadRequested = false;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  button.hidden = Boolean(standalone);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    prompt = event;
    button.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    button.hidden = true;
    status.textContent = 'App instalada.';
  });
  button.addEventListener('click', async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      prompt = null;
    } else
      status.textContent =
        'En iPhone/iPad: abre Safari, Compartir y «Añadir a pantalla de inicio». En Android o escritorio: usa «Instalar app» en el menú del navegador.';
  });
  if (
    typeof __BUILD_ID__ === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !window.isSecureContext
  ) {
    status.textContent = 'El modo sin conexión se prepara en la versión publicada con HTTPS.';
    return;
  }
  status.textContent = 'Preparando contenido sin conexión…';
  const showReady = () => {
    status.textContent = 'Contenido listo sin conexión ✓ · fuentes externas requieren Internet.';
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) location.reload();
    else showReady();
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'UPDATE_BLOCKED') {
      reloadRequested = false;
      status.textContent =
        'Cierra las otras pestañas de OSI Quest para actualizar sin interrumpir sus rondas.';
    }
  });
  navigator.serviceWorker
    .register(backupWorkerURL(new URL('./sw.js', document.baseURI)), {
      scope: './',
      updateViaCache: 'none',
    })
    .then(async (reg) => {
      registration = reg;
      const installing = reg.installing;
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'redundant')
          status.textContent =
            'No se pudo preparar el contenido sin conexión. Recarga con Internet para volver a intentarlo.';
      });
      await navigator.serviceWorker.ready;
      showReady();
      function waiting() {
        if (reg.waiting) {
          app.updateAvailable = true;
          app.refresh();
        }
      }
      waiting();
      reg.addEventListener('updatefound', () =>
        reg.installing?.addEventListener('statechange', waiting),
      );
    })
    .catch(() => {
      status.textContent =
        'No se pudo preparar el modo sin conexión. Puedes seguir usando la app y volver a intentarlo al recargar.';
    });
  app.activatePWAUpdate = () => {
    if (!registration?.waiting) return false;
    reloadRequested = true;
    registration.waiting.postMessage({ type: 'ACTIVATE' });
    return true;
  };
  const update = () => {
    if (!document.hidden) registration?.update().catch(() => {});
  };
  document.addEventListener('visibilitychange', update);
  window.setInterval(update, 15 * 60 * 1000);
}
