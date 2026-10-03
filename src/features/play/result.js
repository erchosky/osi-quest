import { answerLayer } from '../../components/answer-layer.js';
import { roundProgress } from '../../components/round-progress.js';
import { storyResult } from '../story/result.js';
import { questionStudyLink } from '../../components/question-study-link.js';
import { activityById } from '../../data/activities.js';
import { html, escapeHtml, routeLink, raw } from '../../components/html.js';
import { layers } from '../../data/layers.js';
import { REWARDS } from '../../domain/rewards.js';
import { resultInsights, bindResultActions } from './result-insights.js';

const takeaways = {
  order:
    'El envío baja de Aplicación a Física. La recepción sube de Física a Aplicación. Practica ambos recorridos.',
  matching:
    'Una capa se reconoce por lo que hace. Explica cada función con tus palabras y cambia de ejemplo para comprobar que la has entendido.',
  packet:
    'Cada pieza resuelve una pregunta: qué solicita la aplicación, qué proceso lo recibe, cómo se entrega, a qué destino va y cuál es el siguiente salto.',
};

export function resultView(app) {
  const session = app.activity;
  const result = session.finalReport ?? session.result;
  const percent = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const mistakes = result.outcomes?.filter((outcome) => !outcome.correct || outcome.assisted) ?? [];
  return {
    section: 'play',
    title: 'Resultado',
    html: html`${raw(storyResult(session))}
      <section class="result-hero panel">
        <span class="badge badge-lime">RETO COMPLETADO</span>
        <div class="result-medal">✧</div>
        <h1>
          ${percent === 100
            ? '¡Todas las piezas conectan!'
            : percent >= 60
              ? 'Vas haciendo conexiones.'
              : 'Cada intento te enseña algo.'}
        </h1>
        <p>
          ${raw(escapeHtml(session.label ?? activityById.get(session.kind)?.name ?? 'Reto'))} ·
          ${session.difficulty === 'hard' ? 'Difícil' : 'Normal'}
        </p>
        ${raw(roundProgress(session))}
        <div class="result-stats">
          <div>
            <strong>${result.correct}/${result.total}</strong
            ><span
              >${session.recovery
                ? 'recuperaciones sin pista adicional'
                : 'aciertos sin ayuda'}</span
            >
          </div>
          <div><strong>+${result.xp}</strong><span>XP conseguidos</span></div>
        </div>
        ${raw(
          session.kind === 'speedrun'
            ? `<p>Cadena máxima: ${result.bestChain} aciertos. ${result.finishReason === 'time' ? 'Se acabó el tiempo.' : 'Completaste el banco de esta ronda.'}</p>`
            : '',
        )}
        ${raw(
          session.kind === 'survival'
            ? `<p class="survival-finish">${result.finishReason === 'lives' ? 'Se acabaron las tres vidas.' : '¡Has llegado al final con vidas!'} Respondiste ${result.total} de ${result.planned} retos.</p>`
            : '',
        )}
        <p class="small-note">
          ${session.practiceOnly
            ? 'Repaso guiado: sin XP ni estadísticas para el perfil.'
            : session.recovery
              ? `Recuperación inmediata: hasta ${REWARDS[session.difficulty] / 2} XP por objetivo, una vez cada 10 minutos. No modifica tu dominio ni tu calendario.`
              : `${session.difficulty === 'hard' ? 'Difícil' : 'Normal'}: ${REWARDS[session.difficulty]} XP por acierto · ${REWARDS[session.difficulty] / 2} con ayuda.`}
        </p>
        <div class="button-row">
          ${raw(resultActions(session, percent, mistakes.length))}
          ${raw(routeLink('play', 'Elegir otro reto'))}
        </div>
      </section>
      ${raw(resultInsights(result))}
      ${raw(
        session.type === 'quiz' || session.type === 'survival' || session.type === 'speedrun'
          ? html`<section class="result-review">
              <div class="section-heading">
                <h2>${session.isExam ? 'Tu examen, explicado' : 'Qué puedes reforzar'}</h2>
                <span class="badge">${mistakes.length} para repasar</span>
              </div>
              ${raw(
                (session.isExam || session.kind === 'speedrun' ? result.outcomes : mistakes)
                  .map(
                    (outcome) =>
                      html`<details class="review-card panel">
                        <summary>
                          <span
                            class="badge ${outcome.correct && !outcome.assisted
                              ? 'badge-lime'
                              : 'badge-peach'}"
                            >${outcome.correct
                              ? outcome.assisted
                                ? 'Con ayuda'
                                : 'Correcta'
                              : 'Para repasar'}</span
                          ><strong>${raw(escapeHtml(outcome.question.prompt))}</strong>
                        </summary>
                        <div class="review-body">
                          ${raw(answerLayer(outcome.question.layer))}
                          <p>
                            Tu respuesta:
                            <strong
                              >${raw(
                                outcome.selected === null
                                  ? 'Sin responder'
                                  : escapeHtml(outcome.question.choices[outcome.selected]),
                              )}</strong
                            >
                          </p>
                          <p>
                            Respuesta correcta:
                            <strong
                              >${raw(
                                escapeHtml(outcome.question.choices[outcome.question.correctIndex]),
                              )}</strong
                            >
                          </p>
                          <p>${raw(escapeHtml(outcome.question.explanation))}</p>
                          ${raw(questionStudyLink(outcome.question))}
                        </div>
                      </details>`,
                  )
                  .join('') ||
                  '<div class="notice">No hay errores en esta ronda. Prueba otra actividad o sube la dificultad.</div>',
              )}
            </section>`
          : html`<div class="notice">
                ${takeaways[session.kind] ??
                'Sigue practicando con actividades diferentes para conectar las ideas.'}
              </div>
              ${raw(
                mistakes.length
                  ? `<section class="panel"><h2>Ideas que puedes reforzar</h2><div class="button-row">${[
                      ...new Set(mistakes.map((outcome) => outcome.layer)),
                    ]
                      .filter(Boolean)
                      .map((layer) => routeLink(`study/layer-${layer}`, layers[layer - 1].name))
                      .join('')}</div></section>`
                  : '',
              )}`,
      )}`,
    bind() {
      bindResultActions(app);
      document.querySelector('#result-next-round')?.addEventListener('click', () =>
        app.startActivity(session.kind, {
          ...session.launchOptions,
          difficulty: document.querySelector('#result-next-round').dataset.difficulty,
        }),
      );
    },
  };
}

export function resultActions(session, percent, mistakes) {
  const fixed = session.challenge || session.storyChapter || session.kind === 'retry';
  const harder =
    !fixed &&
    percent === 100 &&
    session.difficulty === 'normal' &&
    !['confusions', 'cases', 'duel', 'flashcards'].includes(session.kind);
  const retryPrimary = mistakes > 0 && percent < 60;
  const retry = mistakes
    ? `<button id="retry-mistakes" class="button button-${retryPrimary ? 'primary' : 'secondary'}">Repetir solo los fallos (${mistakes}) →</button>`
    : '';
  const next = fixed
    ? session.kind === 'retry'
      ? '<button id="repeat-retry" class="button button-secondary">Repetir este repaso</button>'
      : routeLink(
          session.challenge
            ? `class/${session.challenge.code}`
            : `story/${session.storyChapter.id}`,
          session.challenge ? 'Volver al mismo reto' : 'Volver al capítulo',
          'button button-secondary',
        )
    : `<button id="result-next-round" data-difficulty="${harder ? 'hard' : session.difficulty}" class="button button-${retryPrimary ? 'secondary' : 'primary'}">${harder ? 'Probar en difícil' : 'Otra ronda'} →</button>`;
  return retryPrimary ? retry + next : next + retry;
}
