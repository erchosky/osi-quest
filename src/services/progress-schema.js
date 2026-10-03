import { assertSafeStructure } from './safe-data.js';
import { verifyIntegrity } from './progress-integrity.js';
import { storyById } from '../data/progress-catalog.js';
import { sanitizeStory } from '../domain/story-progress.js';
import { questionById } from '../data/progress-catalog.js';
import { units } from '../data/units.js';
import { flashcards } from '../data/progress-catalog.js';
import { misconceptions } from '../data/progress-catalog.js';
import { PLAY_FILTERS, sanitizeActivityPreferences } from '../domain/activity-preferences.js';

export const STORAGE_KEY = 'osi-quest-v1';
export function emptyProgress() {
  return {
    version: 3,
    xp: 0,
    difficulty: 'normal',
    radarLevel: 'all',
    playFilter: 'all',
    activityPreferences: {},
    lessonBookmark: null,
    mastered: [],
    read: [],
    stats: {},
    cards: {},
    history: [],
    days: [],
    concepts: {},
    story: { completed: [] },
    recoveryRewards: {},
  };
}

const positiveInteger = (value) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);
const uniqueValid = (value, valid) => [
  ...new Set((Array.isArray(value) ? value : []).filter(valid)),
];

/** Migrate v1/v2 while validating the untrusted contents of backup files. */
export function sanitizeProgress(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Formato de progreso no válido.');
  assertSafeStructure(input);
  const data = emptyProgress();
  data.xp = positiveInteger(input.xp);
  data.difficulty = input.difficulty === 'hard' ? 'hard' : 'normal';
  data.radarLevel = ['all', 'normal', 'hard'].includes(input.radarLevel) ? input.radarLevel : 'all';
  data.playFilter = PLAY_FILTERS.includes(input.playFilter) ? input.playFilter : 'all';
  data.activityPreferences = sanitizeActivityPreferences(input.activityPreferences);
  if (units.some((unit) => unit.id === input.lessonBookmark?.unitId)) {
    data.lessonBookmark = {
      unitId: input.lessonBookmark.unitId,
      sectionIndex: Number.isInteger(input.lessonBookmark.sectionIndex)
        ? Math.min(100, Math.max(0, input.lessonBookmark.sectionIndex))
        : 0,
    };
  }
  data.mastered = uniqueValid(
    input.mastered,
    (key) =>
      typeof key === 'string' &&
      /^(order|function|scenario|protocol|matching|packet)-[1-7]$/.test(key),
  );
  data.read = uniqueValid(input.read, (id) => units.some((unit) => unit.id === id));
  for (const [id, value] of Object.entries(input.stats ?? {})) {
    if (
      !questionById.has(id) ||
      !value ||
      !Number.isFinite(value.seen) ||
      !Number.isFinite(value.correct)
    )
      continue;
    const seen = positiveInteger(value.seen);
    data.stats[id] = {
      seen,
      correct: Math.min(seen, positiveInteger(value.correct)),
      streak: Math.min(10, positiveInteger(value.streak)),
      due: positiveInteger(value.due),
      last: positiveInteger(value.last),
    };
    const levels = {};
    for (const difficulty of ['normal', 'hard']) {
      const item = value.levels?.[difficulty];
      if (!item || !Number.isFinite(item.seen) || !Number.isFinite(item.correct)) continue;
      const count = Math.min(seen, positiveInteger(item.seen));
      levels[difficulty] = {
        seen: count,
        correct: Math.min(count, positiveInteger(item.correct)),
        streak: Math.min(10, positiveInteger(item.streak)),
        due: Math.min(8.64e15, positiveInteger(item.due)),
        last: Math.min(8.64e15, positiveInteger(item.last)),
      };
    }
    if (Object.values(levels).reduce((sum, item) => sum + item.seen, 0) <= seen)
      data.stats[id].levels = levels;
  }
  for (const [id, value] of Object.entries(input.cards ?? {})) {
    if (!flashcards.some((card) => card.id === id) || !value || !Number.isFinite(value.due))
      continue;
    data.cards[id] = {
      level: Math.min(4, positiveInteger(value.level)),
      due: positiveInteger(value.due),
    };
  }
  data.history = (Array.isArray(input.history) ? input.history : [])
    .filter(
      (item) =>
        item &&
        Number.isFinite(item.when) &&
        Number.isFinite(item.total) &&
        Number.isFinite(item.correct),
    )
    .map((item) => ({
      mode: String(item.mode ?? 'practice').slice(0, 40),
      when: Math.min(8.64e15, positiveInteger(item.when)),
      total: positiveInteger(item.total),
      correct: Math.min(positiveInteger(item.total), positiveInteger(item.correct)),
      xp: positiveInteger(item.xp),
      difficulty: item.difficulty === 'hard' ? 'hard' : 'normal',
      durationMs: Number.isFinite(item.durationMs)
        ? Math.min(86400000, positiveInteger(item.durationMs))
        : null,
      timed: item.timed === true,
      retry: item.retry === true,
      recovery: item.recovery === true,
      challengeCode:
        typeof item.challengeCode === 'string' ? item.challengeCode.slice(0, 120) : null,
      caseId: ['cable', 'route', 'web'].includes(item.caseId) ? item.caseId : null,
      chapterId: storyById.has(item.chapterId) ? item.chapterId : null,
      focusLayer:
        Number.isInteger(item.focusLayer) && item.focusLayer >= 1 && item.focusLayer <= 7
          ? item.focusLayer
          : null,
      direction: ['send', 'receive'].includes(item.direction) ? item.direction : null,
      failures: (Array.isArray(item.failures) ? item.failures : [])
        .filter(
          (value) => value && Number.isInteger(value.layer) && value.layer >= 0 && value.layer <= 7,
        )
        .slice(0, 8)
        .map((value) => ({
          layer: value.layer,
          ...Object.fromEntries(
            ['wrong', 'assisted', 'unanswered', 'timedOut'].map((key) => [
              key,
              Math.min(100, positiveInteger(value[key])),
            ]),
          ),
        })),
      players: (Array.isArray(item.players) ? item.players : [])
        .slice(0, 2)
        .map((player, index) => ({
          name: index === 0 ? 'Jugador A' : 'Jugador B',
          total: Math.min(100, positiveInteger(player?.total)),
          correct: Math.min(100, positiveInteger(player?.total), positiveInteger(player?.correct)),
        })),
    }))
    .slice(-30);
  data.story = sanitizeStory(input.story);
  for (const [key, value] of Object.entries(input.recoveryRewards ?? {}).slice(0, 1000)) {
    if (typeof key === 'string' && /^[a-z0-9-]{1,100}$/i.test(key) && Number.isFinite(value))
      data.recoveryRewards[key] = Math.min(8.64e15, positiveInteger(value));
  }
  data.days = uniqueValid(
    input.days,
    (day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day),
  ).slice(-365);
  for (const concept of misconceptions) {
    const candidate = input.concepts?.[concept.id];
    if (!candidate || typeof candidate !== 'object') continue;
    const valid = (id) => concept.questions.some((question) => question.id === id);
    const proofIds = uniqueValid(candidate.proofIds, valid).slice(0, 2);
    const earnedProofIds = uniqueValid(candidate.earnedProofIds, valid).slice(0, 2);
    const earnedAt =
      earnedProofIds.length === 2 && Number.isFinite(candidate.earnedAt) && candidate.earnedAt > 0
        ? Math.min(8.64e15, positiveInteger(candidate.earnedAt))
        : null;
    data.concepts[concept.id] = {
      proofIds,
      earnedProofIds,
      earnedAt,
      needsReview: Boolean(earnedAt && candidate.needsReview),
      retryAfter: Math.min(8.64e15, positiveInteger(candidate.retryAfter)),
    };
  }
  return data;
}

export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 2_000_000)
    throw new Error('La copia supera el límite de 2 MB.');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('La copia no contiene un archivo JSON válido.');
  }
  if (
    ![2, 3].includes(data?.version) ||
    !Array.isArray(data.read) ||
    !data.stats ||
    typeof data.stats !== 'object' ||
    Array.isArray(data.stats)
  ) {
    throw new Error('Elige una copia de progreso de OSI Quest.');
  }
  assertSafeStructure(data);
  verifyIntegrity(data);
  return sanitizeProgress(data);
}
