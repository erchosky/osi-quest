import { roundProgress } from '../../components/round-progress.js';
import { roundExitButton } from '../../components/round-exit.js';
import { answerLayer } from '../../components/answer-layer.js';
import { html, escapeHtml, routeLink, raw } from '../../components/html.js';
import { resultInsights, bindResultActions } from '../play/result-insights.js';

export function flashcardsView(app) {
  const session = app.activity;
  if (session.done)
    return {
      section: 'play',
      title: 'Tarjetas completadas',
      html: html`<section class="panel result-hero">
          <span class="badge badge-lime">REPASO COMPLETADO</span>
          <h1>Recordar es volver a conectar.</h1>
          <p>
            Has repasado ${session.cards.length} tarjetas. Las difíciles vuelven antes; las que
            recuerdas bien esperan más.
          </p>
          <div class="button-row">
            ${raw(
              routeLink('setup/flashcards', 'Volver a las tarjetas', 'button button-primary'),
            )}${raw(routeLink('progress', 'Ver mi progreso'))}${raw(routeLink('play', 'Elegir otro reto'))}
          </div>
        </section>
        ${raw(resultInsights(session.finalReport, { selfRated: true }))}${raw(session.result.missedIds.length ? `<div class="button-row"><button id="retry-mistakes" class="button button-primary">Repetir solo las que costaron (${session.result.missedIds.length}) →</button></div>` : '')}`,
      bind() {
        bindResultActions(app);
      },
    };
  const card = session.current;
  return {
    section: 'play',
    title: 'Tarjetas de memoria',
    html: html`<div class="game-toolbar">
        ${raw(roundExitButton())}
        <span class="badge">${session.index + 1}/${session.cards.length} TARJETAS</span>
      </div>
      <section class="panel flashcard-panel">
        ${raw(roundProgress(session))}
        <p class="eyebrow">CAPA ${card.layer} · RECUERDO ACTIVO</p>
        ${raw(
          session.earlyReview
            ? '<p class="small-note">No hay tarjetas pendientes. Este es un repaso voluntario.</p>'
            : '',
        )}
        <h1>${raw(escapeHtml(card.front))}</h1>
        <p class="subtle">Intenta contestar con tus palabras antes de mirar.</p>
        ${raw(
          session.revealed
            ? html`<div class="flashcard-answer">
                  ${raw(answerLayer(card.layer))}
                  <p>${raw(escapeHtml(card.back))}</p>
                </div>
                <p class="small-note">¿Lo recordabas sin mirar?</p>
                <div class="button-row">
                  <button class="button button-secondary" data-rate="again">
                    Todavía no · repetir pronto</button
                  ><button class="button button-primary" data-rate="known">
                    Sí, lo recordaba ✓
                  </button>
                </div>`
            : '<button class="button button-primary" id="reveal-card">Ver explicación ↻</button>',
        )}
        <p class="small-note">
          El repaso se programa a 1, 3, 7 y 14 días según tus respuestas. Las tarjetas no suman XP.
        </p>
      </section>`,
    bind() {
      document.querySelector('#reveal-card')?.addEventListener('click', () => {
        session.reveal();
        app.refresh();
      });
      document.querySelectorAll('[data-rate]').forEach((button) =>
        button.addEventListener('click', () => {
          const rated = session.rate(button.dataset.rate === 'known');
          if (rated && !session.recovery)
            app.repository.rateCard(rated.id, button.dataset.rate === 'known');
          app.refresh();
        }),
      );
    },
  };
}
