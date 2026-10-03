import { roundExitButton } from '../../components/round-exit.js';
import { html, escapeHtml, raw } from '../../components/html.js';
import { confirmAction } from '../../components/dialog.js';

export function examReviewView(app) {
  const session = app.activity;
  const unanswered = session.questions.filter((question) => !session.answers[question.id]).length;
  return {
    section: 'play',
    title: 'Revisar examen',
    html: html`<div class="game-toolbar">
        ${raw(roundExitButton())}<span class="badge">ANTES DE ENTREGAR</span>
      </div>
      <section class="panel exam-review">
        <p class="eyebrow">ANTES DE ENTREGAR</p>
        <h1>Una última mirada.</h1>
        <p>
          ${session.questions.length - unanswered} respuestas guardadas · ${unanswered} en blanco ·
          ${session.flags.size} dudas marcadas.
        </p>
        <div class="exam-review-list">
          ${raw(
            session.questions
              .map(
                (question, i) =>
                  html`<button class="exam-review-row" data-jump="${i}">
                    <span class="unit-number">${i + 1}</span
                    ><span>${raw(escapeHtml(question.prompt))}</span
                    ><span class="badge"
                      >${
                        !session.answers[question.id]
                          ? 'En blanco'
                          : session.flags.has(question.id)
                            ? '⚑ Revisar'
                            : 'Respondida'
                      }</span
                    ><span>→</span>
                  </button>`,
              )
              .join(''),
          )}
        </div>
        <div class="notice">
          Las preguntas en blanco se cuentan como errores. Puedes volver a cualquiera antes de
          entregar.
        </div>
        <div class="button-row">
          <button class="button button-primary" id="submit-exam">Entregar y ver corrección →</button
          ><button class="button button-secondary" data-jump="0">Volver al examen</button>
        </div>
      </section>`,
    bind() {
      document.querySelectorAll('[data-jump]').forEach((button) =>
        button.addEventListener('click', () => {
          session.jump(Number(button.dataset.jump));
          app.refresh();
        }),
      );
      document.querySelector('#submit-exam').addEventListener('click', async () => {
        if (
          unanswered &&
          !(await confirmAction({
            title: 'Hay preguntas en blanco',
            description: `Quedan ${unanswered} sin responder. Contarán como errores al entregar.`,
            confirmLabel: 'Entregar de todos modos',
          }))
        )
          return;
        const outcomes = session.submit();
        app.recordAnswers(outcomes, session.kind);
        if (outcomes.length) app.completeRound();
        app.refresh();
      });
    },
  };
}
