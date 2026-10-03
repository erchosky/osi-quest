import { roundProgress } from '../../components/round-progress.js';
import { roundExitButton } from '../../components/round-exit.js';
import { answerLayer } from '../../components/answer-layer.js';
import { layers } from '../../data/layers.js';
import { html, escapeHtml, raw } from '../../components/html.js';
import { rewardXP } from '../../domain/rewards.js';
import { rewardHud } from '../../components/reward-hud.js';
import { resultView } from '../play/result.js';
import { bindMatching } from './controller.js';

function taskCard(session, task, index) {
  const matched = session.matched.includes(task.id);
  const selected = session.selectedTask === task.id;
  return html`<div class="matching-piece">
    <button
      class="matching-task ${matched ? 'is-connected' : ''} ${selected ? 'is-selected' : ''}"
      data-match-task="${raw(escapeHtml(task.id))}"
      aria-pressed="${selected}"
      draggable="${!matched}"
      ${raw(matched ? 'aria-disabled="true"' : '')}
    >
      <span class="matching-card-top"
        ><span class="matching-token">${index + 1}</span>
        <span>${matched ? '✓ CONECTADA' : selected ? 'SELECCIONADA' : 'TAREA'}</span></span
      >
      <strong>${raw(escapeHtml(task.title))}</strong
      ><span class="matching-prompt">${raw(escapeHtml(task.prompt))}</span> ${raw(
        matched
          ? html`<span class="matching-destination"
              >${task.layer}. ${layers[task.layer - 1].name}</span
            >`
          : '',
      )}</button
    >${raw(!matched ? mobileConnection(session, task, index) : '')}${raw(session.feedback?.taskId === task.id ? feedback(session) : '')}
    ${raw(
      selected && session.hinted.has(task.id)
        ? html`<div class="hint" role="status">${raw(escapeHtml(task.hint))}</div>`
        : '',
    )}
    ${raw(
      selected
        ? html`<button
            class="button button-secondary matching-hint-button"
            id="matching-hint"
            ${session.hinted.has(task.id) ? 'disabled' : ''}
          >
            Una pista para esta tarea
          </button>`
        : '',
    )}
  </div>`;
}

function mobileConnection(session, task, index) {
  return html`<form class="matching-mobile-controls" data-match-form="${raw(escapeHtml(task.id))}">
    <label for="matching-select-${index}">¿En qué capa encaja esta tarea?</label>
    <select id="matching-select-${index}" name="layer" required>
      <option value="">Elige una capa…</option>
      ${raw(session.layerOrder.map((number) => `<option value="${number}" ${session.outcomes.some((outcome) => outcome.layer === number) ? 'disabled' : ''}>${number} · ${escapeHtml(layers[number - 1].name)}</option>`).join(''))}
    </select>
    <div class="matching-mobile-actions">
      <button type="submit" class="button button-primary">Conectar →</button
      ><button
        type="button"
        class="button button-secondary"
        data-match-hint="${raw(escapeHtml(task.id))}"
        ${session.hinted.has(task.id) ? 'disabled' : ''}
      >
        ${session.hinted.has(task.id) ? 'Pista utilizada' : 'Una pista'}
      </button>
    </div>
  </form>`;
}

function layerCard(session, number) {
  const layer = layers[number - 1];
  const matched = session.outcomes.some((outcome) => outcome.layer === number);
  const selected = session.selectedLayer === number;
  return html`<button
    class="matching-layer ${matched ? 'is-connected' : ''} ${selected ? 'is-selected' : ''}"
    data-match-layer="${number}"
    aria-pressed="${selected}"
    ${raw(matched ? 'aria-disabled="true"' : '')}
    style="--layer-tint:${layer.tint};--layer-color:${layer.color}"
  >
    <span class="matching-layer-number">${number}</span
    ><span
      ><strong>${layer.name}</strong>
      <small
        >${
          matched ? '✓ Conectada' : session.difficulty === 'normal' ? layer.verb : '¿Es aquí?'
        }</small
      ></span
    >
  </button>`;
}

function feedback(session) {
  if (!session.feedback) return '';
  const { correct, explanation, xp, layer } = session.feedback;
  return html`<div
    class="feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}"
    role="status"
  >
    <strong
      >${
        correct
          ? `¡Conexión hecha! ${layers[layer - 1].name} · +${xp} XP`
          : '✗ Conexión incorrecta. Esta conexión todavía no encaja.'
      }</strong
    >
    ${raw(answerLayer(session.cards.find((task) => task.id === session.feedback.taskId).layer))}
    <p>${raw(escapeHtml(explanation))}</p>
    ${raw(
      correct
        ? ''
        : '<p class="small-note">Vuelve a elegir una capa para esta tarea. Este acierto contará con ayuda.</p>',
    )}
  </div>`;
}

export function matchingView(app) {
  const session = app.activity;
  if (session.done) return resultView(app);
  const independentXP = rewardXP({ correct: true, assisted: false }, session.difficulty);
  const assistedXP = rewardXP({ correct: true, assisted: true }, session.difficulty);
  return {
    section: 'play',
    title: 'Une las conexiones',
    html: html`<div class="game-toolbar matching-toolbar">
        ${raw(roundExitButton())}
        <span class="badge"
          >${session.difficulty === 'hard' ? 'DIFÍCIL' : 'NORMAL'} ·
          ${session.matched.length}/${session.cards.length}</span
        >
      </div>
      <section class="panel matching-panel">
        ${raw(roundProgress(session))}
        <div class="matching-heading">
          <div>
            <p class="eyebrow">CADA FUNCIÓN TIENE SU LUGAR</p>
            <h1>Une las conexiones.</h1>
            <p class="subtle">
              <span class="matching-desktop-copy"
                >Selecciona una tarea y su capa. También puedes arrastrar la tarea hasta la
                capa.</span
              ><span class="matching-mobile-copy"
                >Lee cada tarea, elige su capa y pulsa Conectar. Puedes pedir una pista cuando la
                necesites.</span
              >
            </p>
          </div>
          <span class="badge badge-lime">${session.cards.length} parejas por conectar</span>
        </div>
        ${raw(rewardHud(session))}
        <div class="matching-selection" aria-live="polite">
          ${raw(
            session.current
              ? html`<span
                  >Conecta: <strong>${raw(escapeHtml(session.current.title))}</strong></span
                >`
              : session.selectedLayer
                ? html`<span
                    >Elegida: <strong>${layers[session.selectedLayer - 1].name}</strong>. Ahora
                    selecciona su tarea.</span
                  >`
                : '<span>Elige una tarea y busca la capa que realiza esa función.</span>',
          )}
        </div>
        <div class="matching-board">
          <section class="matching-task-column" aria-labelledby="matching-tasks-title">
            <h2 id="matching-tasks-title">¿Qué está ocurriendo?</h2>
            <div class="matching-task-list">
              ${raw(session.cards.map((task, index) => taskCard(session, task, index)).join(''))}
            </div>
          </section>
          <section class="matching-layer-column" aria-labelledby="matching-layers-title">
            <h2 id="matching-layers-title">¿En qué capa?</h2>
            <div class="matching-layer-list">
              ${raw(session.layerOrder.map((number) => layerCard(session, number)).join(''))}
            </div>
            <p class="matching-column-tip">
              ${
                session.difficulty === 'hard'
                  ? 'La trampa está en los detalles. Clasifica la acción descrita.'
                  : 'Mira qué función realiza cada tarea, además de sus palabras clave.'
              }
            </p>
          </section>
        </div>
        <div class="game-actions">
          ${raw(
            !session.current
              ? '<button class="button button-secondary" id="matching-hint" disabled>Selecciona una tarea para pedir una pista</button>'
              : '',
          )}
          <span class="small-note"
            >Sin ayuda: +${independentXP} XP. Con pista o tras un error: +${assistedXP} XP. Solo
            afecta a esa tarea.</span
          >
        </div>
      </section>`,
    bind() {
      bindMatching(app);
    },
  };
}
