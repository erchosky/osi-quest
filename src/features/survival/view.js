import { html, raw } from '../../components/html.js';
import { quizView } from '../quiz/view.js';

export function survivalView(app) {
  const session = app.activity;
  const view = quizView(app);
  if (session.done) return view;
  const hud = html`<div class="survival-hud">
    <span class="life-counter" role="status" aria-label="${session.lives} vidas restantes"
      ><span aria-hidden="true">${'♥'.repeat(session.lives)}${'♡'.repeat(3 - session.lives)}</span>
      ${session.lives}/3 vidas</span
    ><span
      >${raw(session.timed ? `Tiempo restante <output id="survival-time">${Math.ceil(session.remainingMs / 1000)} s</output>` : 'Sin reloj · piensa a tu ritmo')}</span
    ><button class="button button-secondary" id="pause-survival">
      ${session.paused ? 'Continuar' : 'Pausar'}
    </button>
  </div>`;
  if (session.paused)
    return {
      section: 'play',
      title: 'Supervivencia en pausa',
      html: `${hud}<section class="panel empty-state"><h1>Tómate una pausa.</h1><p>Las preguntas y el reloj esperan a que vuelvas.</p></section>`,
      bind() {
        document.querySelector('#pause-survival').addEventListener('click', () => {
          session.togglePause();
          app.refresh();
        });
      },
    };
  return {
    ...view,
    html:
      hud +
      (session.currentAnswer?.timedOut
        ? '<div class="notice">Se acabó el tiempo de esta pregunta. Pierdes una vida; lee la explicación antes de seguir.</div>'
        : '') +
      view.html,
    bind() {
      view.bind();
      const next = document.querySelector('#next-question');
      if (session.lives === 0) next.textContent = 'Ver resultado →';
      document.querySelector('#pause-survival').addEventListener('click', () => {
        session.togglePause();
        app.refresh();
      });
    },
  };
}
