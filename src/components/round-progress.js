import { roundItems } from '../domain/round-progress.js';
import { escapeHtml } from './html.js';
const symbols = { pending: '·', answered: '●', correct: '✓', wrong: '✗', assisted: '◐' };
const labels = {
  pending: 'Pendiente',
  answered: 'Respondida; corrección al entregar',
  correct: 'Acierto sin ayuda',
  wrong: 'Para repasar',
  assisted: 'Con ayuda o recuperación inmediata',
};
export function roundProgress(session, playerIndex) {
  const allItems = roundItems(session, playerIndex);
  const sprint = session.kind === 'speedrun';
  const items = sprint
    ? allItems.filter((item) => item.status !== 'pending' || item.current).slice(-8)
    : allItems;
  const exam = session.isExam && !session.done;
  const completed = items.filter((item) => item.status !== 'pending').length;
  return `<div class="round-progress"><div class="round-progress-caption"><strong>${playerIndex === undefined ? 'Tu recorrido' : escapeHtml(session.names[playerIndex])}</strong><span>${sprint ? Object.keys(session.answers).length + ' intentos · últimos 8' : completed + '/' + items.length} ${sprint ? '' : exam ? 'respondidas' : 'resueltas'}</span></div><ol class="round-dots" aria-label="Progreso de la ronda">${items.map((item, index) => `<li class="round-dot dot-${item.status} ${item.current ? 'is-current' : ''}" ${item.current ? 'aria-current="step"' : ''} aria-label="${index + 1}. ${labels[item.status]}"><span aria-hidden="true">${symbols[item.status]}</span></li>`).join('')}</ol><p class="round-dot-legend">${exam ? '● Respondida · Las soluciones se muestran al entregar.' : '<span>✓ Sin ayuda</span><span>✗ Para repasar</span><span>◐ Con ayuda</span>'}</p></div>`;
}
