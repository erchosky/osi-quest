import { roundProgress } from '../../components/round-progress.js';
import { roundExitButton } from '../../components/round-exit.js';
import { answerChoices } from '../../components/answer-choices.js';
import { alternativeReasons } from '../../components/answer-feedback.js';
import { answerLayer } from '../../components/answer-layer.js';
import { html, escapeHtml, raw } from '../../components/html.js';
import { failureList } from '../play/result-insights.js';
import { layerFailures } from '../../domain/round-report.js';
import { formatDuration } from '../../domain/round-report.js';
import { focusElement } from '../../components/focus.js';

export function duelView(app) {
  const session = app.activity;
  if (session.done) return duelResult(app);
  const toolbar = html`<div class="game-toolbar">
    ${raw(roundExitButton())}<span class="badge"
      >DUELO · ${session.index + 1}/${session.questions.length}</span
    >
  </div>`;
  if (session.phase === 'handoff')
    return {
      section: 'play',
      title: 'Pasa el dispositivo',
      html:
        toolbar +
        html`<section class="panel duel-handoff">
          <span class="badge badge-lime">PASA EL DISPOSITIVO</span>
          <div class="handoff-symbol" aria-hidden="true">⇄</div>
          <h1>Le toca a ${raw(escapeHtml(session.names[session.playerIndex]))}.</h1>
          <p>
            Entrega el móvil sin comentar la respuesta. Las soluciones se muestran cuando ambos
            hayan respondido.
          </p>
          <button id="duel-ready" class="button button-primary">Listo para responder →</button>
          <p class="small-note">
            El marcador es del duelo; los XP y la precisión del perfil permanecen separados.
          </p>
        </section>`,
      bind() {
        document.querySelector('#duel-ready').addEventListener('click', () => {
          session.beginTurn();
          app.refresh();
          app.announce(`Turno de ${session.names[session.playerIndex]}. ${session.current.prompt}`);
          focusElement('.question-title');
        });
      },
    };
  const question = session.current;
  if (session.phase === 'reveal')
    return {
      section: 'play',
      title: 'Comparar respuestas',
      html:
        toolbar +
        html`<section class="panel game-panel">
          <p class="eyebrow">AMBOS HABÉIS RESPONDIDO</p>
          <h1 class="question-title">${raw(escapeHtml(question.prompt))}</h1>
          ${raw(roundProgress(session, 0))}${raw(roundProgress(session, 1))}
          <div class="duel-response-grid">
            ${raw(session.outcomes.map((outcome, index) => `<div class="duel-response ${outcome.correct ? 'is-right' : ''}"><strong>${escapeHtml(session.names[index])}</strong><p>${escapeHtml(question.choices[outcome.selected])}</p><span>${outcome.correct ? '✓ Acierto · 1 punto' : '✗ Respuesta incorrecta · 0 puntos'}</span></div>`).join(''))}
          </div>
          <div class="feedback">
            <strong>La idea que resuelve el reto</strong>
            ${raw(answerLayer(question.layer))}
            <p>${raw(escapeHtml(question.choices[question.correctIndex]))}</p>
            <p>${raw(escapeHtml(question.explanation))}</p>
            ${raw(alternativeReasons(question, session.options))}
          </div>
          <div class="game-actions duel-actions">
            <button id="duel-next" class="button button-primary">
              ${session.index === session.questions.length - 1 ? 'Ver el marcador' : 'Siguiente pareja de turnos'}
              →
            </button>
          </div>
        </section>`,
      bind() {
        document.querySelector('#duel-next').addEventListener('click', () => {
          session.next();
          if (session.done) app.completeRound();
          app.refresh();
          if (!session.done)
            app.announce(
              `Pregunta ${session.index + 1} de ${session.questions.length}. Le toca a ${session.names[session.playerIndex]}.`,
            );
          focusElement('h1');
        });
      },
    };
  return {
    section: 'play',
    title: 'Duelo por turnos',
    html:
      toolbar +
      html`<section class="panel game-panel">
        ${raw(roundProgress(session, 0))}${raw(roundProgress(session, 1))}
        <p class="eyebrow">TURNO DE ${raw(escapeHtml(session.names[session.playerIndex]))}</p>
        <h1 class="question-title">${raw(escapeHtml(question.prompt))}</h1>
        <div class="answer-list">${raw(answerChoices(question, session.options))}</div>
        <p class="small-note">
          Una respuesta por persona. Después, pasa el dispositivo; la solución llegará tras el
          segundo turno.
        </p>
      </section>`,
    bind() {
      document.querySelectorAll('[data-choice]').forEach((button) =>
        button.addEventListener('click', () => {
          if (session.answer(Number(button.dataset.choice))) {
            app.refresh();
            app.announce(
              session.phase === 'handoff'
                ? `Respuesta guardada. Pasa el dispositivo a ${session.names[session.playerIndex]}.`
                : 'Ambos habéis respondido. Ahora podéis revisar la solución.',
            );
            focusElement(session.phase === 'handoff' ? '#duel-ready' : '.question-title');
          }
        }),
      );
    },
  };
}

function duelResult(app) {
  const session = app.activity;
  const result = session.finalReport;
  const scores = result.players.map((player) => player.correct);
  const tied = scores[0] === scores[1];
  return {
    section: 'play',
    title: 'Marcador del duelo',
    html: html`<section class="panel result-hero">
      <span class="badge badge-lime">DUELO COMPLETADO</span>
      <h1>
        ${raw(tied ? '¡Empate de conexiones!' : `${escapeHtml(result.players[scores[0] > scores[1] ? 0 : 1].name)} se lleva el duelo.`)}
      </h1>
      <p>
        ${formatDuration(result.durationMs)} de juego activo · ${session.questions.length} preguntas
        para cada persona
      </p>
      <div class="duel-scoreboard">
        ${raw(result.players.map((player, index) => `<article class="duel-score"><h2>${escapeHtml(player.name)}</h2><strong>${player.correct}/${player.total}</strong><p>${player.missedIds.length} ideas para reforzar</p>${player.missedIds.length ? failureList(layerFailures(player.outcomes)) : ''}${player.missedIds.length ? `<button class="button button-secondary" data-duel-retry="${index}">Repetir solo sus fallos →</button>` : '<span class="badge badge-lime">Todas conectadas</span>'}</article>`).join(''))}
      </div>
      <p class="small-note">
        Cada acierto vale 1 punto. El duelo conserva su marcador sin sumar las respuestas de dos
        personas al perfil.
      </p>
      <div class="button-row">
        <a href="#/setup/duel" class="button button-primary">Jugar otro duelo →</a
        ><a href="#/play" class="button button-secondary">Elegir otra actividad</a>
      </div>
    </section>`,
    bind() {
      document
        .querySelectorAll('[data-duel-retry]')
        .forEach((button) =>
          button.addEventListener('click', () =>
            app.repeatMistakes(Number(button.dataset.duelRetry)),
          ),
        );
    },
  };
}
