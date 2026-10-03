import { escapeHtml } from './html.js';
import { answerLayer } from './answer-layer.js';
import { questionStudyLink } from './question-study-link.js';
import { layers } from '../data/layers.js';

export function alternativeReasons(question, order = question.choices.map((_, index) => index)) {
  const authored =
    Array.isArray(question.whyChoices) && question.whyChoices.length === question.choices.length;
  const reasons = authored
    ? question.whyChoices
    : question.layerQuestion
      ? question.choices.map((choice) => layers.find((layer) => layer.name === choice)?.purpose)
      : null;
  if (!reasons?.every((reason) => typeof reason === 'string' && reason.trim())) return '';
  return `<details class="alternative-reasons"><summary>Por qué no las otras</summary><ul>${order
    .map((index) =>
      index === question.correctIndex
        ? ''
        : `<li><strong>${escapeHtml(question.choices[index])}</strong><p>${escapeHtml(reasons[index])}</p></li>`,
    )
    .join('')}</ul></details>`;
}

export function answerFeedback(question, answer, { badge, options } = {}) {
  const title = answer.correct
    ? answer.assisted
      ? `✓ Bien, con una ayuda. +${answer.xp} XP`
      : `✓ ¡Buena conexión! +${answer.xp} XP`
    : '✗ Respuesta incorrecta. Vamos a conectar las ideas.';
  return `<div id="question-feedback" class="feedback ${answer.correct ? 'feedback-correct' : 'feedback-wrong'}" role="region" aria-label="Explicación de la respuesta" tabindex="-1">
    <strong>${title}</strong>
    ${answerLayer(question.layer)}
    <p class="feedback-answer"><span>Respuesta correcta</span><strong>${escapeHtml(question.choices[question.correctIndex])}</strong></p>
    <p>${escapeHtml(question.explanation)}</p>
    ${alternativeReasons(question, options)}
    ${badge ? `<p class="earned-badge-note">✧ Insignia conseguida: ${escapeHtml(badge.title)}</p>` : ''}
    ${questionStudyLink(question)}
  </div>`;
}
