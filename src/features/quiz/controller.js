import { focusElement } from '../../components/focus.js';
import { retireReward } from '../../app/reward-feedback.js';

export function bindQuiz(app) {
  const session = app.activity;
  document.querySelectorAll('[data-choice]').forEach((button) =>
    button.addEventListener('click', () => {
      if (
        button.getAttribute('aria-disabled') === 'true' ||
        (!session.isExam && session.currentAnswer)
      )
        return;
      const outcome = session.answer(Number(button.dataset.choice));
      if (!outcome) return;
      if (outcome && !session.isExam) app.recordAnswer(outcome, session.kind);
      app.refresh();
      if (!session.isExam)
        app.announce(
          `${outcome.correct ? 'Respuesta correcta.' : 'Respuesta incorrecta.'} ${outcome.question.layer ? `Capa ${outcome.question.layer}. ` : ''}La explicación está disponible debajo de las respuestas.`,
        );
      focusElement(session.isExam ? `[data-choice="${button.dataset.choice}"]` : '#next-question', {
        preventScroll: true,
      });
    }),
  );
  document.querySelector('#show-explanation')?.addEventListener('click', () => {
    retireReward();
    focusElement('#question-feedback', { block: 'start' });
  });
  document.querySelector('#hint-button')?.addEventListener('click', () => {
    session.hint();
    app.refresh();
    focusElement('[data-choice]:not(:disabled)', { preventScroll: true });
  });
  document.querySelector('#flag-question')?.addEventListener('click', () => {
    session.toggleFlag();
    app.refresh();
    focusElement('#flag-question');
  });
  document.querySelector('#exam-back')?.addEventListener('click', () => {
    session.jump(session.index - 1);
    app.refresh();
    focusElement('[data-choice]:not(:disabled)');
  });
  document.querySelectorAll('[data-jump]').forEach((button) =>
    button.addEventListener('click', () => {
      session.jump(Number(button.dataset.jump));
      app.refresh();
      focusElement('[data-choice]:not(:disabled)');
    }),
  );
  document.querySelector('#next-question')?.addEventListener('click', () => {
    if (!session.next()) return;
    if (session.done) app.completeRound();
    app.refresh();
    if (!session.done && !session.reviewing)
      app.announce(
        `Pregunta ${session.index + 1} de ${session.questions.length}. ${session.current.prompt}`,
      );
    focusElement(
      session.done ? '.result-hero h1' : session.reviewing ? '.exam-review h1' : '.question-title',
      { preventScroll: !session.done && !session.reviewing },
    );
  });
}
