import { roundProgress } from '../../components/round-progress.js';
import { roundExitButton } from '../../components/round-exit.js';
import { answerLayer } from '../../components/answer-layer.js';
import { layers } from '../../data/layers.js';
import { layerMap } from '../../components/layer-map.js';
import { html, raw } from '../../components/html.js';
import { resultView } from '../play/result.js';
import { rewardHud } from '../../components/reward-hud.js';
import { REWARDS } from '../../domain/rewards.js';
import { focusElement } from '../../components/focus.js';

export function orderView(app) {
  const session = app.activity;
  if (session.done) return resultView(app);
  const sending = session.direction === 'send';
  const expected = layers.find((layer) => layer.number === session.expected);
  return {
    section: 'play',
    title: 'Construye las capas',
    html: html`<div class="game-toolbar">
        ${raw(roundExitButton())}
        <span class="badge"
          >${session.difficulty === 'hard' ? 'DIFÍCIL' : 'NORMAL'} ·
          ${session.built.length}/${session.targets.length}</span
        >
      </div>
      <div class="order-layout">
        <section class="panel game-panel">
          ${raw(roundProgress(session))} ${raw(rewardHud(session))}
          <p class="eyebrow">
            ${sending
              ? 'ENVÍO · DE LA APLICACIÓN AL MEDIO'
              : 'RECEPCIÓN · DEL MEDIO A LA APLICACIÓN'}
          </p>
          <h1 class="question-title">
            ${sending ? 'Prepara el mensaje para salir.' : 'Reconstruye el camino de llegada.'}
          </h1>
          <p class="subtle">
            ${session.difficulty === 'normal'
              ? `Selecciona la capa ${session.expected}.`
              : session.retry
                ? 'Entre las capas pendientes, ¿cuál viene ahora en el recorrido?'
                : `Paso ${session.built.length + 1}: ¿qué capa sigue en este recorrido?`}
          </p>
          <div class="order-slots">
            ${raw(
              session.routeTargets
                .map(
                  (number, i) =>
                    html`<div
                      class="order-slot ${session.built.includes(number) ||
                      session.contextLayers.includes(number)
                        ? 'filled'
                        : number === session.expected
                          ? 'next'
                          : ''}"
                    >
                      <span>${i + 1}</span>${session.built.includes(number) ||
                      session.contextLayers.includes(number)
                        ? layers[number - 1].name
                        : number === session.expected
                          ? '¿Qué capa sigue?'
                          : 'Pendiente'}${session.built.includes(number) ||
                      session.contextLayers.includes(number)
                        ? ' ✓'
                        : ''}
                    </div>`,
                )
                .join(''),
            )}
          </div>
          <div class="order-bank">
            ${raw(
              session.bank
                .map(
                  (number) =>
                    html`<button
                      class="layer-choice"
                      data-layer="${number}"
                      ${!session.recovery &&
                      (session.built.includes(number) || session.contextLayers.includes(number))
                        ? 'disabled'
                        : ''}
                    >
                      ${layers[number - 1].name}
                    </button>`,
                )
                .join(''),
            )}
          </div>
          ${raw(
            session.feedback
              ? html`<div
                  class="feedback ${session.feedback.correct
                    ? 'feedback-correct'
                    : 'feedback-wrong'}"
                  role="status"
                >
                  <strong
                    >${session.feedback.correct ? '¡En su sitio!' : 'Todavía no va aquí.'}</strong
                  >
                  ${raw(answerLayer(session.feedback.target))}
                  <p>
                    ${session.feedback.correct
                      ? layers[session.feedback.target - 1].description
                      : `Piensa en el recorrido de ${sending ? 'envío' : 'recepción'}. Puedes volver a intentarlo.`}
                  </p>
                </div>`
              : '',
          )}${raw(
            session.assisted
              ? html`<div class="hint">
                  ${expected.number}. ${expected.name}: ${expected.purpose}
                </div>`
              : '',
          )}<button
            class="button button-secondary"
            id="order-hint"
            ${session.assisted ? 'disabled' : ''}
          >
            Necesito una pista
          </button>
        </section>
        ${raw(
          session.difficulty === 'normal'
            ? html`<aside class="panel">
                <p class="eyebrow">TU MAPA DE APOYO</p>
                ${raw(layerMap(session.expected))}
                <p class="small-note">Míralo cuando lo necesites. Después prueba sin él.</p>
              </aside>`
            : html`<aside class="tip-card">
                <p class="eyebrow">EL RETO DIFÍCIL</p>
                <h2>Piensa en funciones.</h2>
                <p>
                  Envío: empezar en el servicio que pide el usuario y acabar en las señales.
                  Recepción: el camino inverso.
                </p>
                <p>
                  Un error o una pista reducen a ${REWARDS[session.difficulty] / 2} XP el acierto de
                  ese paso.
                </p>
              </aside>`,
        )}
      </div>`,
    bind() {
      document.querySelectorAll('[data-layer]').forEach((button) =>
        button.addEventListener('click', () => {
          const outcome = session.answer(Number(button.dataset.layer));
          if (outcome?.correct && !app.activity.practiceOnly) app.repository.recordOrder(outcome);
          if (session.done) app.completeRound();
          app.refresh();
          focusElement(session.done ? '.result-hero h1' : '[data-layer]:not(:disabled)');
        }),
      );
      document.querySelector('#order-hint').addEventListener('click', () => {
        session.assisted = true;
        app.refresh();
        focusElement('[data-layer]:not(:disabled)');
      });
    },
  };
}
