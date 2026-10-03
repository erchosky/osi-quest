import { escapeHtml } from './html.js';

/** Revealed answers remain reachable by keyboard so every alternative can be reviewed. */
export function answerChoices(question, order, { answer, reveal = false, editable = false } = {}) {
  return order
    .map((choice, index) => {
      const correct = reveal && choice === question.correctIndex;
      const wrong = reveal && choice === answer?.selected && !answer.correct;
      const selected = editable && choice === answer?.selected;
      const status = correct ? 'Correcta' : wrong ? 'Tu respuesta' : 'Sin seleccionar';
      return `<button class="answer ${correct ? 'is-correct' : ''} ${wrong ? 'is-wrong' : ''} ${selected ? 'is-selected' : ''}" data-choice="${choice}" ${reveal ? 'aria-disabled="true"' : ''} ${editable ? `aria-pressed="${selected}"` : ''}>
      <span class="answer-letter" aria-hidden="true">${String.fromCharCode(65 + index)}</span>
      <span>${escapeHtml(question.choices[choice])}</span>
      <span class="answer-mark ${correct || wrong ? '' : 'reserved-hidden'}" ${correct || wrong ? '' : 'aria-hidden="true"'}><span aria-hidden="true">${wrong ? '✗' : '✓'}</span><span>${status}</span></span>
    </button>`;
    })
    .join('');
}
