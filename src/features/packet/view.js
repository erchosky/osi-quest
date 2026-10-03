import { roundProgress } from '../../components/round-progress.js';
import { roundExitButton } from '../../components/round-exit.js';
import { answerLayer } from '../../components/answer-layer.js';
import { html, escapeHtml, raw } from '../../components/html.js';
import { rewardHud } from '../../components/reward-hud.js';
import { packetScenario } from '../../data/packet-missions.js';
import { layers } from '../../data/layers.js';
import { rewardXP } from '../../domain/rewards.js';
import { resultView } from '../play/result.js';
import { bindPacket } from './controller.js';

function packetAssembly(session) {
  const has = (id) => session.placements.includes(id);
  let bundle = html`<div class="packet-envelope packet-payload ${has('request') ? 'is-built' : ''}">
    <span>Aplicación · HTTP</span
    ><strong>${has('request') ? 'GET /aprender' : 'Tu petición aparecerá aquí'}</strong>
  </div>`;
  for (const [id, label, detail, style] of [
    ['port', 'Transporte · TCP', 'Destino: puerto 80', 'packet-tcp'],
    ['address', 'Red · IPv4', 'Destino: 203.0.113.20', 'packet-ip'],
    ['next-hop', 'Enlace · Ethernet', 'Destino: MAC del router local', 'packet-ethernet'],
  ]) {
    if (has(id))
      bundle = html`<div class="packet-envelope ${style}">
        <span>${label}</span><strong>${detail}</strong>${raw(bundle)}
      </div>`;
  }
  return html`<aside class="panel packet-board" aria-label="Tu envío en construcción">
    <p class="eyebrow">LO QUE ESTÁS CONSTRUYENDO</p>
    <h2>Una petición, varias funciones.</h2>
    <div class="packet-assembly">${raw(bundle)}</div>
    <div class="packet-delivery ${has('reliability') ? 'is-built' : ''}">
      <span>${has('reliability') ? '✓' : '○'}</span>
      <p>${has('reliability') ? 'TCP: flujo fiable y ordenado' : 'TCP: entrega pendiente'}</p>
    </div>
    <div class="packet-wire ${has('signals') ? 'is-transmitted' : ''}">
      <span>Tu portátil</span>
      <div class="packet-cable" aria-hidden="true"><i></i><i></i><i></i></div>
      <span>Router local</span>
    </div>
    <p class="small-note">
      ${
        has('signals')
          ? '¡Primer enlace transmitido! La trama llega al router; el paquete sigue hacia el servidor.'
          : 'El paquete viaja dentro de una trama. Cada enlace prepara su propia entrega local.'
      }
    </p>
    <a href="#/study/encapsulation" class="text-link">Entender la encapsulación →</a>
  </aside>`;
}

function missionSteps(session) {
  return html`<ol class="packet-steps" aria-label="Etapas del envío">
    ${raw(
      session.missions
        .map(
          (mission, index) =>
            html`<li
              class="${session.placements.includes(mission.id) ? 'is-complete' : ''} ${
                index === session.index ? 'is-current' : ''
              }"
              ${raw(index === session.index ? 'aria-current="step"' : '')}
            >
              <span>${session.placements.includes(mission.id) ? '✓' : index + 1}</span
              ><strong>${mission.label}</strong>
            </li>`,
        )
        .join(''),
    )}
  </ol>`;
}

export function packetView(app) {
  const session = app.activity;
  if (session.done) return resultView(app);
  const mission = session.current;
  const selected = session.choices.find((choice) => choice.id === session.selected);
  const xp = rewardXP(
    { correct: true, assisted: session.assisted || session.hadError },
    session.difficulty,
  );
  return {
    section: 'play',
    title: 'Construye el envío',
    html: html`<div class="game-toolbar packet-toolbar">
        ${raw(roundExitButton())}
        <span class="badge"
          >${session.difficulty === 'hard' ? 'DIFÍCIL' : 'NORMAL'} ·
          ${session.outcomes.length}/${session.missions.length} piezas</span
        >
      </div>
      <section class="packet-scenario panel">
        <div>
          <p class="eyebrow">MISIÓN · CONSTRUYE EL ENVÍO</p>
          <h2>${packetScenario.title}</h2>
          <p>${packetScenario.description}</p>
        </div>
        <div class="packet-route">
          <span>Portátil <strong>${packetScenario.sourceIP}</strong></span
          ><b aria-hidden="true">→</b
          ><span>Router <strong>${packetScenario.gatewayIP}</strong></span
          ><b aria-hidden="true">→</b
          ><span>Servidor <strong>${packetScenario.serverIP}</strong></span>
        </div>
        <p class="small-note">${packetScenario.protocol}</p>
      </section>
      ${raw(missionSteps(session))}${raw(rewardHud(session))}
      <div class="packet-layout">
        <section class="panel game-panel packet-mission">
          ${raw(roundProgress(session))}
          <div class="question-eyebrow">
            <p class="eyebrow">
              PASO ${session.index + 1} · ${layers[mission.layer - 1].name.toUpperCase()}
            </p>
            <span class="badge badge-lime"
              >${
                session.placed ? '+' + session.outcomes.at(-1).xp + ' XP' : xp + ' XP al acertar'
              }</span
            >
          </div>
          <h1 class="question-title" id="packet-title" tabindex="-1">${mission.title}</h1>
          <p class="packet-task">${mission.description}</p>
          ${raw(
            session.difficulty === 'normal'
              ? html`<p class="packet-support">
                  <strong>Antes de construir:</strong> ${mission.support}
                </p>`
              : '',
          )}
          <p class="small-note packet-instruction">
            ${
              session.placed
                ? 'Lee por qué encaja y continúa con la siguiente función.'
                : 'Arrastra una pieza al espacio o selecciónala y pulsa el botón. También puedes usar Tab y Enter.'
            }
          </p>
          <div class="packet-token-bank" aria-label="Piezas disponibles">
            ${raw(
              session.choices
                .map(
                  (choice) =>
                    html`<button
                      type="button"
                      class="packet-token ${session.selected === choice.id ? 'is-selected' : ''}"
                      data-packet-token="${choice.id}"
                      aria-pressed="${session.selected === choice.id}"
                      draggable="${!session.placed}"
                      ${session.placed ? 'disabled' : ''}
                    >
                      <strong>${raw(escapeHtml(choice.label))}</strong
                      ><span>${raw(escapeHtml(choice.detail))}</span>
                    </button>`,
                )
                .join(''),
            )}
          </div>
          <div
            id="packet-tray"
            class="packet-tray ${selected ? 'has-piece' : ''} ${
              session.placed ? 'is-complete' : ''
            }"
            aria-label="Pieza elegida"
          >
            <span aria-hidden="true">${session.placed ? '✓' : '+'}</span>
            <div>
              <strong>${raw(selected ? escapeHtml(selected.label) : 'Coloca tu pieza aquí')}</strong
              ><small
                >${
                  selected
                    ? session.placed
                      ? 'Integrada en tu envío'
                      : 'Lista para probar: aún puedes cambiarla'
                    : 'Selecciona o arrastra una de las piezas'
                }</small
              >
            </div>
          </div>
          ${raw(
            session.feedback
              ? html`<div
                  id="packet-feedback"
                  class="feedback ${session.feedback.correct ? 'feedback-correct' : 'feedback-wrong'}"
                  role="status"
                  tabindex="-1"
                >
                  <strong>${raw(escapeHtml(session.feedback.title))}</strong>
                  ${raw(answerLayer(mission.layer))}
                  <p>${raw(escapeHtml(session.feedback.text))}</p>
                  ${raw(
                    session.feedback.correct
                      ? ''
                      : '<p>Puedes probar otra pieza. El acierto de este paso contará con ayuda.</p>',
                  )}
                </div>`
              : '',
          )}
          ${raw(
            session.assisted
              ? html`<div class="hint" id="packet-hint-text" tabindex="-1">${mission.hint}</div>`
              : '',
          )}
          <div class="game-actions">
            ${raw(
              !session.placed
                ? html`<button
                      class="button button-secondary"
                      id="packet-hint"
                      ${session.assisted ? 'disabled' : ''}
                    >
                      Necesito una pista</button
                    ><button
                      class="button button-primary"
                      id="packet-add"
                      ${selected ? '' : 'disabled'}
                    >
                      ${mission.verb} →
                    </button>`
                : html`<span class="small-note">${mission.packetLabel}</span
                    ><button class="button button-primary" id="packet-next">
                      ${
                        session.index === session.missions.length - 1
                          ? 'Ver mi resultado'
                          : 'Siguiente función'
                      }
                      →
                    </button>`,
            )}
          </div>
        </section>
        ${raw(packetAssembly(session))}
      </div>
      <p class="small-note packet-simulation-note">${packetScenario.note}</p>`,
    bind() {
      bindPacket(app);
    },
  };
}
