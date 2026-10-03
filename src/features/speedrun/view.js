import { quizView } from '../quiz/view.js';
import { html } from '../../components/html.js';
export function speedrunView(app) {
  const session = app.activity;
  const view = quizView(app);
  if (session.done) return view;
  return {
    ...view,
    html:
      html`<div class="survival-hud speedrun-hud">
        <strong>Sprint OSI</strong
        ><output id="speedrun-time" aria-label="Tiempo restante"
          >${Math.ceil(session.remainingMs / 1000)} s</output
        ><span>Cadena ${session.chain} · Récord ${session.bestChain}</span
        ><span
          >${session.currentAnswer
            ? session.bonusMs
              ? `+${session.bonusMs / 1000} segundos`
              : 'Sin tiempo extra'
            : 'Identifica la capa'}</span
        >
      </div>` + view.html,
  };
}
