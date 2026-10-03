import { roundProgress } from '../../components/round-progress.js';
import { roundExitButton } from '../../components/round-exit.js';
import { answerChoices } from '../../components/answer-choices.js';
import { answerFeedback } from '../../components/answer-feedback.js';
import { html, escapeHtml, raw } from '../../components/html.js';
import { activityById } from '../../data/activities.js';
import { bindQuiz } from './controller.js';
import { resultView } from '../play/result.js';
import { examReviewView } from './exam-review.js';
import { rewardHud } from '../../components/reward-hud.js';

export function quizView(app) {
  const session = app.activity;
  if (session.done) return resultView(app);
  if (session.reviewing) return examReviewView(app);
  const question = session.current;
  const answer = session.currentAnswer;
  const revealed = answer && !session.isExam;
  const title = session.label ?? session.caseStudy?.title ?? activityById.get(session.kind)?.name;
  return {
    section: 'play',
    title,
    html: html`<div class="game-toolbar">
        ${raw(roundExitButton())}
        <span class="badge"
          >${session.isExam ? 'EXAMEN' : session.difficulty === 'hard' ? 'DIFÍCIL' : 'NORMAL'} ·
          ${session.index + 1}/${session.questions.length}</span
        >
      </div>
      <section class="game-panel panel ${session.kind === 'speedrun' ? 'speedrun-panel' : ''}">
        ${raw(roundProgress(session))} ${raw(rewardHud(session))}
        <div class="question-eyebrow">
          <p class="eyebrow">
            ${raw(escapeHtml(title))}${session.caseStudy
              ? ` · PASO ${session.caseStudy.questionIds.indexOf(question.id) + 1}`
              : ''}
          </p>
          ${raw(
            session.questions.some((item) => item.tricky) && !session.isExam
              ? `<span class="badge badge-peach ${question.tricky ? '' : 'reserved-hidden'}" ${question.tricky ? '' : 'aria-hidden="true"'}>Ojo: hay una confusión habitual</span>`
              : '',
          )}
        </div>
        ${raw(
          session.caseStudy
            ? html`<p class="case-context">${raw(escapeHtml(session.caseStudy.description))}</p>`
            : '',
        )}
        ${raw(
          session.storyChapter
            ? `<details class="story-round-context"><summary>Contexto de tu red de casa</summary><span class="badge badge-lime">TU RED DE CASA</span><p>${escapeHtml(session.storyChapter.scene)}</p></details>`
            : '',
        )}
        <h1 class="question-title">${raw(escapeHtml(question.prompt))}</h1>
        <div class="answer-list">
          ${raw(
            answerChoices(question, session.options[session.index], {
              answer,
              reveal: revealed,
              editable: session.isExam,
            }),
          )}
        </div>
        <div class="question-feedback-slot ${session.isExam ? 'is-exam' : ''}">
          ${raw(
            !session.isExam && !session.assisted && !revealed
              ? '<div class="feedback-placeholder"><span aria-hidden="true">7 · 6 · 5 · 4 · 3 · 2 · 1</span><p>La explicación y su capa aparecerán aquí al responder.</p></div>'
              : '',
          )}
          ${raw(
            session.assisted && !answer
              ? html`<div class="hint">
                  <strong>Una pista</strong>
                  <p>
                    ${raw(
                      escapeHtml(
                        question.hint ||
                          `Piensa en la función principal de la capa ${question.layer}.`,
                      ),
                    )}
                  </p>
                </div>`
              : '',
          )}${raw(
            revealed
              ? answerFeedback(question, answer, {
                  badge: app.activity.recentBadge,
                  options: session.options[session.index],
                })
              : '',
          )}
        </div>
        <div class="game-actions quiz-actions" aria-label="Acciones de la pregunta">
          ${raw(
            session.isExam
              ? html`<button class="button button-secondary" id="flag-question">
                    ${session.flags.has(question.id) ? '⚑ Duda marcada' : 'Marcar duda'}</button
                  ><button
                    class="button button-ghost"
                    id="exam-back"
                    ${session.index === 0 ? 'disabled' : ''}
                  >
                    ← Anterior</button
                  ><button class="button button-primary" id="next-question">
                    ${session.index === session.questions.length - 1
                      ? 'Revisar examen'
                      : 'Siguiente →'}
                  </button>`
              : `${revealed ? '<button class="button button-secondary explanation-jump" id="show-explanation">Ver explicación ↓</button>' : ''}${!answer ? html`<button class="button button-secondary" id="hint-button" ${session.assisted ? 'disabled' : ''}>${session.assisted ? 'Pista utilizada' : 'Necesito una pista'}</button>` : ''}<button class="button button-primary" id="next-question" ${!answer ? 'disabled' : ''}>${session.index === session.questions.length - 1 ? 'Ver resultado →' : 'Siguiente →'}</button>`,
          )}
        </div>
      </section>
      ${raw(
        session.isExam
          ? html`<div class="exam-navigation" aria-label="Preguntas del examen">
                ${raw(
                  session.questions
                    .map(
                      (item, i) =>
                        html`<button
                          class="exam-number ${session.answers[item.id]
                            ? 'answered'
                            : ''} ${session.flags.has(item.id) ? 'flagged' : ''}"
                          data-jump="${i}"
                          aria-label="Pregunta ${i + 1}${session.flags.has(item.id)
                            ? ', marcada con duda'
                            : ''}"
                          ${raw(i === session.index ? 'aria-current="step"' : '')}
                        >
                          ${i + 1}${session.flags.has(item.id) ? ' ⚑' : ''}
                        </button>`,
                    )
                    .join(''),
                )}
              </div>
              <p class="small-note center">
                Puedes cambiar cualquier respuesta. Las soluciones aparecerán al entregar.
              </p>`
          : '',
      )}`,
    bind() {
      bindQuiz(app);
    },
  };
}
