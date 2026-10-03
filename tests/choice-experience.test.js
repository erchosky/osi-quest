import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activityOptions,
  sanitizeActivityPreferences,
  optionSummary,
  pendingReviews,
  activitySummary,
  recommendedActivity,
} from '../src/domain/activity-preferences.js';
import { createProgressRepository } from '../src/services/progress-repository.js';
import {
  sanitizeProgress,
  emptyProgress,
  parseBackup,
  STORAGE_KEY,
} from '../src/services/progress-schema.js';
import { questions } from '../src/data/questions/index.js';
import { flashcards } from '../src/data/flashcards.js';
import { misconceptions } from '../src/data/misconceptions.js';
import { playView } from '../src/features/play/view.js';
import { setupView } from '../src/features/play/setup.js';
import { filterCounts } from '../src/features/play/filters.js';
import { activities } from '../src/data/activities.js';
import { cases } from '../src/data/cases.js';

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
}

test('Remembered choices keep each activity independent and exclude challenge and player data', () => {
  const memory = storage();
  const repository = createProgressRepository(memory);
  repository.rememberActivity('order', {
    difficulty: 'normal',
    direction: 'send',
    seed: 9,
    targetLayers: [4],
  });
  repository.rememberActivity('survival', {
    difficulty: 'hard',
    timed: 'on',
    questionIds: ['secret'],
  });
  repository.rememberActivity('duel', {
    difficulty: 'normal',
    player1: 'Private name',
    player2: 'Other name',
  });
  repository.rememberActivity('story', { chapterId: 'router' });
  repository.setDifficulty('hard');
  const restored = createProgressRepository(memory);
  assert.deepEqual(restored.activityOptions('order'), { difficulty: 'normal', direction: 'send' });
  assert.deepEqual(restored.activityOptions('survival'), { difficulty: 'hard', timed: true });
  assert.deepEqual(restored.activityOptions('duel'), { difficulty: 'normal' });
  assert.equal(restored.activityOptions('story'), null);
  assert.equal(restored.data.activityPreferences.story, undefined);
  const returned = restored.activityOptions('order');
  returned.direction = 'receive';
  assert.equal(restored.activityOptions('order').direction, 'send');
  assert.equal(memory.getItem(STORAGE_KEY).includes('Private name'), false);
});

test('Invalid preference imports get bounded defaults while preserving useful choices', () => {
  const preferences = sanitizeActivityPreferences({
    order: { difficulty: 'hard', direction: 'receive', seed: 10 },
    survival: { difficulty: 'invalid', timed: 'false' },
    cases: { caseId: 'unknown', difficulty: 'hard' },
    flashcards: { difficulty: 'hard', cardIds: ['unknown'] },
    function: [],
    unknown: { difficulty: 'hard' },
  });
  assert.deepEqual(preferences.order, { difficulty: 'hard', direction: 'receive' });
  assert.deepEqual(preferences.survival, { difficulty: 'normal', timed: false });
  assert.deepEqual(preferences.cases, { difficulty: 'normal', caseId: cases[0].id });
  assert.deepEqual(preferences.flashcards, { difficulty: 'normal' });
  assert.equal(preferences.function, undefined);
  assert.equal(preferences.unknown, undefined);
  assert.deepEqual(sanitizeActivityPreferences([]), {});
  assert.deepEqual(activityOptions('order', {}, 'hard'), { difficulty: 'hard', direction: 'send' });
});

test('Filters, lesson bookmark and lesson read/unread choices survive backup and reload', () => {
  const memory = storage();
  const repository = createProgressRepository(memory);
  repository.setPlayFilter('due');
  repository.rememberLesson('basics', 2);
  repository.setRead('basics', true);
  repository.setRead('basics', false);
  repository.setRead('unknown', true);
  repository.rememberActivity('cases', { caseId: cases.at(-1).id });
  const backup = parseBackup(repository.export());
  assert.equal(backup.playFilter, 'due');
  assert.deepEqual(backup.lessonBookmark, { unitId: 'basics', sectionIndex: 2 });
  assert.deepEqual(backup.read, []);
  assert.equal(createProgressRepository(memory).activityOptions('cases').caseId, cases.at(-1).id);
  repository.setPlayFilter('injected');
  repository.rememberLesson('unknown', 100);
  assert.equal(repository.data.playFilter, 'due');
  assert.equal(repository.data.lessonBookmark.unitId, 'basics');
});

test('Preference migration preserves XP, scheduled evidence and recovery limits', () => {
  const source = {
    ...emptyProgress(),
    xp: 200,
    read: ['basics'],
    playFilter: 'untrusted',
    stats: { [questions[0].id]: { seen: 2, correct: 1, streak: 0, due: 123, last: 120 } },
    recoveryRewards: { 'order-receive-1': 1000 },
    lessonBookmark: { unitId: 'basics', sectionIndex: 999999 },
  };
  const sanitized = sanitizeProgress(source);
  assert.equal(sanitized.xp, 200);
  assert.deepEqual(sanitized.read, ['basics']);
  assert.equal(sanitized.stats[questions[0].id].seen, 2);
  assert.equal(sanitized.recoveryRewards['order-receive-1'], 1000);
  assert.equal(sanitized.playFilter, 'all');
  assert.equal(sanitized.lessonBookmark.sectionIndex, 100);
  assert.equal(
    sanitizeProgress({ lessonBookmark: { unitId: 'basics', sectionIndex: NaN } }).lessonBookmark
      .sectionIndex,
    0,
  );
  assert.equal(
    sanitizeProgress({ lessonBookmark: { unitId: 'unknown', sectionIndex: 2 } }).lessonBookmark,
    null,
  );
});

test('Pending review counts attempted due work separately from unseen and future items', () => {
  const normal = questions.filter(
    (question) => question.type !== 'case' && question.difficulty === 'normal',
  );
  const hard = questions.find(
    (question) => question.type !== 'case' && question.difficulty === 'hard',
  );
  const progress = {
    ...emptyProgress(),
    stats: {
      [normal[0].id]: { seen: 1, due: 99 },
      [normal[1].id]: { seen: 1, due: 101 },
      [hard.id]: { seen: 1, due: 99, levels: { hard: { seen: 1, due: 99 } } },
    },
    cards: { [flashcards[0].id]: { due: 99 }, [flashcards[1].id]: { due: 101 } },
    concepts: { [misconceptions[0].id]: { needsReview: true } },
  };
  assert.equal(pendingReviews(progress, 'adaptive', 'normal', 100), 1);
  assert.equal(pendingReviews(progress, 'adaptive', 'hard', 100), 1);
  assert.equal(pendingReviews(progress, 'flashcards', 'normal', 100), 1);
  assert.equal(pendingReviews(progress, 'confusions', 'normal', 100), 1);
  assert.equal(pendingReviews(progress, 'function', 'normal', 100), 0);
  assert.equal(activitySummary(progress, 'flashcards', 100).unseenCards, flashcards.length - 2);
});

test('Personal best and latest result compare matching configurations and exclude classroom or recovery', () => {
  const progress = {
    ...emptyProgress(),
    activityPreferences: { order: { difficulty: 'normal', direction: 'send' } },
    history: [
      { mode: 'order', total: 7, correct: 6, difficulty: 'normal', direction: 'send' },
      { mode: 'order', total: 7, correct: 4, difficulty: 'normal', direction: 'send' },
      { mode: 'order', total: 7, correct: 7, difficulty: 'hard', direction: 'send' },
      { mode: 'order', total: 7, correct: 7, difficulty: 'normal', direction: 'receive' },
      {
        mode: 'order',
        total: 7,
        correct: 7,
        difficulty: 'normal',
        direction: 'send',
        challengeCode: 'class',
      },
      {
        mode: 'order',
        total: 7,
        correct: 7,
        difficulty: 'normal',
        direction: 'send',
        recovery: true,
      },
    ],
  };
  const summary = activitySummary(progress, 'order', 100);
  assert.equal(summary.best.correct, 6);
  assert.equal(summary.latest.correct, 4);
  assert.equal(summary.remembered, true);
});

test('Recommendations respond to evidence rather than always advertising the same activity', () => {
  assert.equal(recommendedActivity(emptyProgress(), 100).kind, 'order');
  const progress = { ...emptyProgress(), stats: { [questions[0].id]: { seen: 1, due: 90 } } };
  assert.equal(recommendedActivity(progress, 100).kind, 'adaptive');
  progress.stats = {};
  progress.concepts = { [misconceptions[0].id]: { needsReview: true } };
  assert.equal(recommendedActivity(progress, 100).kind, 'confusions');
  progress.concepts = {};
  progress.cards = { [flashcards[0].id]: { due: 90 } };
  assert.equal(recommendedActivity(progress, 100).kind, 'flashcards');
  progress.cards = {};
  progress.history = [{ mode: 'matching', total: 7, correct: 5 }];
  assert.equal(recommendedActivity(progress, 100).kind, 'matching');
  progress.history = [{ mode: 'order', total: 7, correct: 7 }];
  assert.equal(recommendedActivity(progress, 100).kind, 'function');
});

test('Activity selection renders separate quickstart buttons and configuration links without nested anchors', () => {
  const repository = createProgressRepository(null);
  repository.rememberActivity('order', { difficulty: 'normal', direction: 'send' });
  const markup = playView({ repository }).html;
  assert.equal((markup.match(/class="activity-card /g) ?? []).length, activities.length);
  assert.equal((markup.match(/<a[^>]*href="#\/setup\//g) ?? []).length, activities.length);
  assert.ok(markup.includes('data-quickstart="order"'));
  assert.ok(markup.includes('Jugar · Normal · Envío'));
  assert.ok(markup.includes('Como la última vez'));
  assert.equal(markup.includes('data-play-filter="due"'), false);
  assert.ok(markup.includes('class="activity-preview"'));
  assert.equal(/<a\b[^>]*class="activity-card/.test(markup), false);
});

test('Setup loads per-activity case, timer and direction; difficulty has no direction-reset handler', () => {
  const repository = createProgressRepository(null);
  repository.setDifficulty('hard');
  repository.rememberActivity('order', { difficulty: 'normal', direction: 'send' });
  repository.rememberActivity('cases', { caseId: cases.at(-1).id });
  repository.rememberActivity('survival', { difficulty: 'hard', timed: true });
  const order = setupView({ repository }, 'order').html;
  assert.match(order, /name="difficulty"\s+value="normal"\s+checked/);
  assert.match(order, /name="direction"\s+value="send"\s+checked/);
  assert.match(
    setupView({ repository }, 'cases').html,
    new RegExp(`name="caseId"\\s+value="${cases.at(-1).id}"\\s+checked`),
  );
  assert.match(setupView({ repository }, 'survival').html, /name="timed" checked/);
  assert.equal(
    optionSummary('order', repository.activityOptions('order')),
    'Normal · Envío · 7 → 1',
  );
});

test('Filter counts include all fifteen activities and only activities with due evidence', () => {
  const summaries = Object.fromEntries(
    activities.map(({ id }) => [id, { pending: id === 'adaptive' || id === 'confusions' ? 1 : 0 }]),
  );
  assert.deepEqual(filterCounts(summaries), {
    all: 15,
    'hands-on': 3,
    situations: 9,
    review: 3,
    due: 2,
  });
});
