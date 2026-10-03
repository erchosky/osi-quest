import { setHTML } from '../../components/dom-renderer.js';
import { escapeHtml } from '../../components/html.js';
export function showRoundSheet(session) {
  const root = document.querySelector('#modal-root');
  if (root.querySelector('dialog[open]')) return Promise.resolve('continue');
  const previous = document.activeElement;
  const description = session.isExam
    ? 'Si sales, perderás las respuestas de este examen sin entregar.'
    : session.type === 'duel'
      ? 'Si sales, perderás el duelo en curso y su marcador.'
      : 'Si sales, perderás la ronda en curso. Las respuestas y los XP de práctica ya guardados se conservan.';
  setHTML(
    root,
    `<dialog class="dialog round-sheet" aria-labelledby="round-sheet-title" aria-describedby="round-sheet-description"><div class="sheet-handle" aria-hidden="true"></div><p class="eyebrow">LA RONDA SIGUE ABIERTA</p><h2 id="round-sheet-title">¿Qué quieres hacer?</h2><p id="round-sheet-description">${description} Pausar conserva la ronda en esta pestaña hasta que la recargues o la cierres.</p><div class="round-sheet-actions"><button class="button button-secondary" data-round-action="pause">Pausar</button><button class="button button-danger" data-round-action="exit">Salir y perder la ronda</button><button class="button button-primary" data-round-action="continue">Seguir jugando</button></div></dialog>`,
  );
  const dialog = root.querySelector('dialog');
  return new Promise((resolve) => {
    let finished = false;
    function finish(action) {
      if (finished) return;
      finished = true;
      dialog.close();
      root.replaceChildren();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      resolve(action);
    }
    dialog
      .querySelectorAll('[data-round-action]')
      .forEach((button) =>
        button.addEventListener('click', () => finish(button.dataset.roundAction)),
      );
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish('continue');
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const b = dialog.getBoundingClientRect();
        if (
          event.clientX < b.left ||
          event.clientX > b.right ||
          event.clientY < b.top ||
          event.clientY > b.bottom
        )
          finish('continue');
      }
    });
    dialog.showModal();
    dialog.querySelector('[data-round-action="continue"]').focus();
  });
}
export function pausedRoundView() {
  return {
    section: 'play',
    title: 'Ronda en pausa',
    html: `<div class="game-toolbar"><button type="button" class="round-close" data-round-close aria-label="Cerrar o pausar la ronda">×</button><span class="badge">EN PAUSA</span></div><section class="panel round-pause-screen"><span class="pause-symbol" aria-hidden="true">Ⅱ</span><p class="eyebrow">TUS DECISIONES SIGUEN AQUÍ</p><h1>Respira. La ronda puede esperar.</h1><p>Las preguntas están ocultas y el reloj está detenido. La ronda se conserva mientras mantengas abierta esta pestaña.</p><button class="button button-primary" data-resume-round>Seguir jugando →</button></section>`,
  };
}
export function pausedRoundBanner(app) {
  if (!app.roundPaused || !app.activity || app.activity.done || app.currentRoute === 'play/run')
    return '';
  return '<div class="notice paused-round-banner"><span>Tienes una ronda en pausa en esta pestaña.</span><button class="button button-secondary" data-resume-round>Retomar ronda →</button></div>';
}
export function retryNotice(session) {
  if ((!session?.retry && !session?.recovery) || session.done) return '';
  return `<div class="notice retry-notice">${session.practiceOnly ? 'Repaso del duelo: solo tus preguntas pendientes, sin modificar el perfil.' : session.recovery ? 'Recuperación inmediata: la solución está reciente. Los aciertos suman la mitad de XP una sola vez cada 10 minutos, sin subir el radar, el repaso espaciado ni las insignias.' : 'Solo vuelves a las ideas pendientes.'}${session.type === 'packet' ? ' Las piezas ya resueltas se reutilizan como contexto.' : ''}</div>`;
}
export function activityErrorView(message) {
  return {
    section: 'play',
    title: 'No se pudo abrir el reto',
    html: `<section class="panel empty-state"><h1>Esta ronda no pudo empezar.</h1><p>${escapeHtml(message)}</p><a class="button button-primary" href="#/play">Elegir una actividad →</a></section>`,
  };
}
