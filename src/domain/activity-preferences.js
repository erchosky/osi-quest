import { reviewEvidence } from './review-evidence.js';
import { activities, activityById } from '../data/activities.js';
import { cases } from '../data/cases.js';
import { questions } from '../data/progress-catalog.js';
import { flashcards } from '../data/progress-catalog.js';
import { misconceptions } from '../data/progress-catalog.js';

export const PLAY_FILTERS = ['all', 'hands-on', 'situations', 'review', 'due'];
export const NO_DIFFICULTY = new Set(['flashcards', 'cases', 'confusions']);

/** Keep only the personal choices that can safely be reused for a new round. */
export function activityOptions(kind, candidate = {}, fallbackDifficulty = 'normal') {
  if (!activityById.has(kind)) return null;
  const source =
    candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const difficulty = NO_DIFFICULTY.has(kind)
    ? 'normal'
    : ['normal', 'hard'].includes(source.difficulty)
      ? source.difficulty
      : fallbackDifficulty === 'hard'
        ? 'hard'
        : 'normal';
  const result = { difficulty };
  if (kind === 'focus')
    result.layer =
      Number.isInteger(Number(source.layer)) &&
      Number(source.layer) >= 1 &&
      Number(source.layer) <= 7
        ? Number(source.layer)
        : 4;
  if (kind === 'order')
    result.direction = ['send', 'receive'].includes(source.direction)
      ? source.direction
      : difficulty === 'hard'
        ? 'send'
        : 'receive';
  if (kind === 'cases')
    result.caseId = cases.some((item) => item.id === source.caseId) ? source.caseId : cases[0].id;
  if (kind === 'survival') result.timed = source.timed === true || source.timed === 'on';
  return result;
}

export function sanitizeActivityPreferences(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {};
  const preferences = {};
  for (const { id } of activities) {
    const value = candidate[id];
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    preferences[id] = activityOptions(id, value);
  }
  return preferences;
}

export function optionSummary(kind, options) {
  if (kind === 'flashcards') return 'Repaso espaciado';
  if (kind === 'confusions') return 'Comprobaciones de conceptos';
  if (kind === 'cases')
    return cases.find((item) => item.id === options.caseId)?.title ?? cases[0].title;
  const parts = [options.difficulty === 'hard' ? 'Difícil' : 'Normal'];
  if (kind === 'focus') parts.push(`Capa ${options.layer}`);
  if (kind === 'order')
    parts.push(options.direction === 'send' ? 'Envío · 7 → 1' : 'Recepción · 1 → 7');
  if (kind === 'survival') parts.push(options.timed ? 'Con reloj' : 'Sin reloj');
  return parts.join(' · ');
}

function personalRounds(progress, kind, options) {
  return (progress.history ?? []).filter(
    (round) =>
      round.mode === kind &&
      round.total > 0 &&
      !round.challengeCode &&
      !round.retry &&
      !round.recovery &&
      round.difficulty === options.difficulty &&
      (kind !== 'order' || round.direction === options.direction) &&
      (kind !== 'cases' || round.caseId === options.caseId) &&
      (kind !== 'focus' || round.focusLayer === options.layer) &&
      (kind !== 'survival' || round.timed === options.timed),
  );
}

/** Pending items are reviews of answers already attempted, not imaginary new homework. */
export function pendingReviews(progress, kind, difficulty = 'normal', now = Date.now()) {
  if (kind === 'flashcards')
    return flashcards.filter((card) => progress.cards?.[card.id]?.due <= now).length;
  if (kind === 'confusions')
    return misconceptions.filter((concept) => progress.concepts?.[concept.id]?.needsReview).length;
  if (kind !== 'adaptive') return 0;
  return questions.filter((question) => {
    if (question.type === 'case' || (difficulty === 'normal' && question.difficulty !== 'normal'))
      return false;
    const stat = progress.stats?.[question.id];
    if (!stat || !stat.seen) return false;
    const evidence = reviewEvidence(stat, difficulty);
    return evidence?.due <= now;
  }).length;
}

export function activitySummary(progress, kind, now = Date.now()) {
  const options = activityOptions(kind, progress.activityPreferences?.[kind], progress.difficulty);
  const rounds = personalRounds(progress, kind, options);
  const latest = rounds.at(-1) ?? null;
  const best = rounds.reduce(
    (winner, round) =>
      !winner || round.correct / round.total > winner.correct / winner.total ? round : winner,
    null,
  );
  const pending = pendingReviews(progress, kind, options.difficulty, now);
  const unseenCards =
    kind === 'flashcards' ? flashcards.filter((card) => !progress.cards?.[card.id]).length : 0;
  return {
    options,
    remembered: Boolean(progress.activityPreferences?.[kind]),
    latest,
    best,
    pending,
    unseenCards,
  };
}

export function recommendedActivity(progress, now = Date.now()) {
  const adaptive = activitySummary(progress, 'adaptive', now);
  if (adaptive.pending)
    return {
      kind: 'adaptive',
      reason: `${adaptive.pending} preguntas que ya practicaste necesitan otro intento.`,
    };
  const confusions = activitySummary(progress, 'confusions', now);
  if (confusions.pending)
    return {
      kind: 'confusions',
      reason: `${confusions.pending} confusiones superadas necesitan una nueva comprobación.`,
    };
  const cards = activitySummary(progress, 'flashcards', now);
  if (cards.pending)
    return {
      kind: 'flashcards',
      reason: `Hoy toca recordar ${cards.pending} tarjetas que ya estudiaste.`,
    };
  const personal = (progress.history ?? []).filter(
    (round) => !round.challengeCode && !round.retry && !round.recovery,
  );
  const latest = personal.at(-1);
  if (
    latest &&
    ['order', 'matching', 'packet', 'function', 'scenario', 'protocol'].includes(latest.mode) &&
    latest.correct < latest.total
  )
    return {
      kind: latest.mode,
      reason:
        'Tu última ronda dejó alguna idea por reforzar. Prueba a explicarla antes de responder.',
    };
  const next = [
    'order',
    'function',
    'matching',
    'scenario',
    'protocol',
    'packet',
    'cases',
    'exam',
  ].find((kind) => !personal.some((round) => round.mode === kind));
  return next
    ? {
        kind: next,
        reason:
          next === 'order'
            ? 'Empieza colocando las capas: el orden será tu mapa para los demás retos.'
            : 'Añade otra forma de practicar lo que ya conoces.',
      }
    : {
        kind: 'exam',
        reason:
          'Ya has probado las actividades principales. Comprueba qué puedes explicar sin ayuda.',
      };
}
