import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressRepository } from '../src/services/progress-repository.js';
import { parseBackup, sanitizeProgress, STORAGE_KEY } from '../src/services/progress-schema.js';
import { scheduleCard, recordQuestion } from '../src/domain/scheduling.js';
import { questions } from '../src/data/questions/index.js';

const DAY = 86_400_000;
function memoryStorage(initial) {
  const values = new Map(initial ? [[STORAGE_KEY, JSON.stringify(initial)]] : []);
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
}

test('Existing v2 progress migrates without losing valid XP, lessons, statistics or history', () => {
  const old = {
    version: 2,
    xp: 20,
    read: ['basics'],
    mastered: ['order-1'],
    difficulty: 'hard',
    stats: { 'function-1': { seen: 2, correct: 1, streak: 1, due: 123, last: 100 } },
    cards: {},
    history: [{ mode: 'order', when: 100, total: 7, correct: 6, xp: 65 }],
    days: ['2026-09-30'],
  };
  const repository = createProgressRepository(memoryStorage(old));
  assert.equal(repository.data.version, 3);
  assert.equal(repository.data.xp, 20);
  assert.deepEqual(repository.data.read, ['basics']);
  assert.equal(repository.data.stats['function-1'].correct, 1);
  assert.equal(repository.data.history.length, 1);
  assert.equal(parseBackup(JSON.stringify(old)).xp, 20);
});

test('Progress backs up and reloads rewards, assisted answers and review scheduling', () => {
  const storage = memoryStorage();
  const repository = createProgressRepository(storage);
  repository.recordAnswer({ question: questions[0], correct: true, assisted: true }, 'function');
  repository.recordAnswer(
    {
      question: questions.find((question) => question.id === 'function-2'),
      correct: true,
      assisted: false,
    },
    'function',
  );
  repository.markRead('basics');
  const restored = createProgressRepository(storage);
  assert.equal(restored.data.xp, 12);
  assert.equal(restored.data.stats['function-1'].correct, 0);
  assert.ok(restored.data.mastered.includes('function-2'));
  assert.equal(parseBackup(restored.export()).read[0], 'basics');
});

test('Malformed backups cannot inject unknown ids, inflate accuracy or retain invalid numbers', () => {
  assert.throws(() => parseBackup('not json'));
  assert.throws(() => parseBackup('{}'));
  const data = sanitizeProgress({
    xp: -20,
    read: ['basics', 'basics', 'unknown'],
    stats: {
      unknown: { seen: 4, correct: 4 },
      'function-1': { seen: 2, correct: 900, streak: -1 },
    },
  });
  assert.equal(data.xp, 0);
  assert.deepEqual(data.read, ['basics']);
  assert.equal(data.stats['function-1'].correct, 2);
  assert.equal(data.stats.unknown, undefined);
});

test('Blocked or corrupt local storage falls back to usable in-memory progress', () => {
  const repository = createProgressRepository({
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
  });
  repository.markRead('basics');
  assert.equal(repository.persistent, false);
  assert.deepEqual(repository.data.read, ['basics']);
  assert.equal(createProgressRepository(null).persistent, false);
});

test('Spaced review follows 1/3/7 days and 1/3/7/14 for cards; mistakes reset intervals', () => {
  let card;
  for (const interval of [1, 3, 7, 14, 14]) {
    card = scheduleCard(card, true, 1000);
    assert.equal(card.due, 1000 + interval * DAY);
  }
  assert.equal(scheduleCard(card, false, 1000).due, 1000);
  let question;
  for (const interval of [1, 3, 7, 7]) {
    question = recordQuestion(question, true, false, 1000);
    assert.equal(question.due, 1000 + interval * DAY);
  }
  assert.equal(recordQuestion(question, true, true, 1000).due, 1000);
  assert.equal(recordQuestion(question, false, false, 1000).streak, 0);
});
