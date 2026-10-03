import { units } from '../../data/units.js';
import { storyById } from '../../data/progress-catalog.js';
import { html, pageHeading, escapeHtml, progressBar, raw } from '../../components/html.js';
import { summarize, summarizeLayer, dueCount } from '../../domain/progress-metrics.js';
import { questions, learningQuestions } from '../../data/progress-catalog.js';
import { masteryView, badgesView, bindMastery } from './mastery-view.js';
import { formatDuration } from '../../domain/round-report.js';
import { layers } from '../../data/layers.js';
import { flashcards } from '../../data/progress-catalog.js';
import { activityById } from '../../data/activities.js';
import { bindProgressActions } from './actions.js';
import { levelProgress, REWARDS } from '../../domain/rewards.js';

export function progressView(app) {
  const data = app.repository.data;
  const stats = summarize(data.stats);
  const level = levelProgress(data.xp);
  const due = dueCount(questions, data.stats, data.difficulty);
  const cardDue = flashcards.filter(
    (card) => !data.cards[card.id] || data.cards[card.id].due <= Date.now(),
  ).length;
  return {
    section: 'progress',
    title: '',
    html: html`${raw(
        pageHeading(
          'LO QUE YA HAS CONECTADO',
          'Tu progreso, a tu ritmo.',
          'Consulta tus avances y elige qué reforzar.',
        ),
      )}
      <section class="panel level-panel">
        <span class="level-emblem">${level.level}</span>
        <div>
          <h2>Nivel ${level.level} de experiencia</h2>
          <p>
            ${level.remaining} XP para el siguiente nivel. Tu progreso se conserva; las nuevas
            rondas usan las nuevas recompensas.
          </p>
          ${raw(
            progressBar(
              (level.current / level.target) * 100,
              'Experiencia hacia el siguiente nivel',
            ),
          )}
          <div class="reward-rates">
            <span>Normal<strong>+${REWARDS.normal} XP</strong></span
            ><span>Difícil<strong>+${REWARDS.hard} XP</strong></span>
          </div>
        </div>
        <a class="button button-primary" href="#/play">Elegir mi siguiente reto →</a>
      </section>
      <div class="stat-grid">
        <div class="panel stat-card">
          <span>Experiencia</span><strong>${data.xp}<small> XP</small></strong>
          <p>Aciertos y práctica</p>
        </div>
        <div class="panel stat-card">
          <span>Estudio</span><strong>${data.read.length}<small> / ${units.length}</small></strong>
          <p>Lecciones leídas</p>
        </div>
        <div class="panel stat-card">
          <span>Precisión</span
          ><strong>${stats.precision === null ? '—' : stats.precision + '%'}</strong>
          <p>${stats.attempts} respuestas · sin ayuda</p>
        </div>
        <div class="panel stat-card">
          <span>Constancia</span><strong>${data.days.length}<small> días</small></strong>
          <p>Con actividad registrada</p>
        </div>
      </div>
      ${raw(masteryView(app))}${raw(badgesView(app))}
      <div class="progress-layout">
        <section class="panel">
          <div class="section-heading">
            <h2>Cómo llevas cada capa</h2>
            <span class="badge">${stats.unique} preguntas distintas</span>
          </div>
          <p class="small-note">
            La precisión cuenta respuestas de preguntas y exámenes. Las pistas ayudan a aprender,
            pero no cuentan como aciertos independientes. Esta lista muestra precisión; el radar
            también exige variedad de preguntas, por eso puede mostrar una cifra menor.
          </p>
          <div class="layer-progress-list">
            ${raw(
              layers
                .map((layer) => {
                  const metric = summarizeLayer(learningQuestions, data.stats, layer.number);
                  return html`<a class="layer-progress" href="#/study/layer-${layer.number}"
                    ><span
                      class="layer-number small"
                      style="--layer-color:${layer.color};--layer-tint:${layer.tint}"
                      >${layer.number}</span
                    >
                    <div>
                      <strong>${layer.name}</strong>${raw(
                        progressBar(metric.precision ?? 0, `${layer.name}: aciertos`),
                      )}<small
                        >${
                          metric.attempts
                            ? `${metric.correct}/${metric.attempts} respuestas correctas`
                            : 'Todavía sin practicar preguntas'
                        }</small
                      >
                    </div>
                    <b>${metric.precision === null ? '—' : metric.precision + '%'}</b></a
                  >`;
                })
                .join(''),
            )}
          </div>
        </section>
        <aside>
          <div class="panel">
            <p class="eyebrow">TU PRÓXIMO REPASO</p>
            <h2>Que las ideas se queden.</h2>
            <p>${due} preguntas pendientes de repaso.<br />${cardDue} tarjetas para recordar.</p>
            <div class="button-stack">
              <a class="button button-primary" href="#/setup/adaptive">Repasar preguntas →</a
              ><a class="button button-secondary" href="#/setup/flashcards">Abrir tarjetas</a>
            </div>
            <p class="small-note">
              Una pregunta acertada vuelve en 1, 3 y 7 días. Las tarjetas llegan hasta 14 días.
            </p>
          </div>
          <div class="tip-card">
            <strong>El orden también cuenta.</strong>
            <p>
              ${data.mastered.filter((id) => id.startsWith('order-')).length}/7 capas colocadas sin
              ayuda alguna vez. El juego de orden suma XP; su precisión se muestra al acabar cada
              ronda.
            </p>
          </div>
        </aside>
      </div>
      <section class="panel history-panel">
        <h2>Tus últimas rondas</h2>
        ${raw(
          data.history.length
            ? html`<div class="history-list">
                ${raw(
                  [...data.history]
                    .reverse()
                    .map(
                      (item) =>
                        html`<div class="history-row">
                          <div>
                            <strong
                              >${raw(escapeHtml((item.mode === 'story' ? `Historia · ${storyById.get(item.chapterId)?.title ?? 'Tu red de casa'}` : activityById.get(item.mode)?.name) ?? (item.mode === 'retry' ? 'Repaso de fallos' : item.mode)))}</strong
                            ><small
                              >${new Date(item.when).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                              ·
                              ${item.difficulty === 'hard' ? 'Difícil' : 'Normal'}${item.timed ? ' · con reloj' : ''}${item.recovery ? ' · recuperación' : item.retry ? ' · solo fallos' : ''}${item.challengeCode ? ' · clase' : ''}
                              · ${formatDuration(item.durationMs)}</small
                            >
                          </div>
                          <span
                            >${raw(item.mode === 'duel' && item.players?.length ? item.players.map((player) => `${escapeHtml(player.name)}: ${player.correct}/${player.total}`).join(' · ') : `${item.correct}/${item.total}`)}</span
                          ><span class="badge"
                            >${item.mode === 'duel' ? 'Puntos del duelo' : item.mode === 'flashcards' ? 'Autoevaluación' : `+${item.xp} XP`}</span
                          >
                        </div>`,
                    )
                    .join(''),
                )}
              </div>`
            : '<p class="subtle">Todavía no hay rondas completadas. Tu primera conexión empieza con un reto.</p>',
        )}
      </section>
      <section class="panel backup-panel">
        <div>
          <p class="eyebrow">TU PROGRESO ES TUYO</p>
          <h2>Guarda una copia.</h2>
          <p>
            Se guarda en este navegador. Exporta una copia para llevarla a otro dispositivo o
            recuperarla más adelante.
          </p>
          ${raw(
            !app.repository.persistent
              ? '<p class="feedback feedback-wrong">El progreso actual está en memoria. Revisa el aviso de guardado y exporta una copia antes de cerrar.</p>'
              : '',
          )}
        </div>
        <label class="export-history-option"
          ><input type="checkbox" id="export-history" checked /> Incluir historial (duelos
          anonimizados)</label
        >
        <div class="button-row">
          <button class="button button-secondary" id="export-progress">Exportar copia</button
          ><label class="button button-secondary" for="import-progress">Importar copia</label
          ><input
            class="file-input"
            id="import-progress"
            aria-describedby="backup-status"
            type="file"
            accept="application/json,.json"
          /><button class="button button-ghost danger" id="reset-progress">Borrar progreso</button>
        </div>
        <p class="small-note" id="backup-status" role="alert"></p>
        <p class="small-note">
          La copia contiene XP, lecciones, ajustes y repasos. Los nombres de duelo no se guardan.
          Puedes omitir el historial.
        </p>
        <button class="button button-ghost" id="clear-history">Borrar solo historial</button>
      </section>`,
    bind() {
      bindProgressActions(app);
      bindMastery(app);
    },
  };
}
