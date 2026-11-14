import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressJournal, JOURNAL_PREFIX } from '../src/services/progress-journal.js';
import { createProgressRepository } from '../src/services/progress-repository.js';
import { emptyProgress, STORAGE_KEY } from '../src/services/progress-schema.js';
import { serializeProgress } from '../src/services/progress-integrity.js';
import { questions } from '../src/data/questions/index.js';

function memoryStorage() {
  const map = new Map();
  const writes = [];
  return {
    writes,
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (key) => map.get(key) ?? null,
    setItem(key, value) {
      map.set(key, value);
      writes.push(key);
    },
    removeItem: (key) => map.delete(key),
  };
}

test('Cached reads replay only appended events and return independent mutable snapshots', () => {
  const storage = memoryStorage();
  const batches = [];
  const journal = createProgressJournal(storage, emptyProgress(), (base, events) => {
    batches.push(events.length);
    return { ...base, xp: base.xp + events.length };
  });
  journal.read();
  const first = journal.prepare('recordActivity', [{ correct: true }, 'packet'], 1000);
  journal.append(first);
  const a = journal.read();
  a.data.xp = 999;
  assert.equal(journal.read().data.xp, 1);
  journal.append(journal.prepare('recordActivity', [{ correct: true }, 'packet'], 1001));
  assert.equal(journal.read().data.xp, 2);
  assert.deepEqual(batches, [0, 1, 1]);
});

test('Earlier external events, edited entries, deletions and base changes invalidate replay caches', () => {
  const storage = memoryStorage();
  const batches = [];
  const journal = createProgressJournal(storage, emptyProgress(), (base, events) => {
    batches.push(events.length);
    return { ...base, xp: base.xp + events.reduce((sum, event) => sum + event.args[0], 0) };
  });
  journal.read();
  const first = journal.prepare('recordActivity', [1], 1000);
  journal.append(first);
  journal.read();
  const { integrity: eventIntegrity, ...event } = JSON.parse(first.value);
  const earlier = JOURNAL_PREFIX + 'external';
  storage.setItem(earlier, serializeProgress({ ...event, args: [2], order: event.order - 1 }));
  assert.equal(journal.read().data.xp, 3);
  storage.setItem(earlier, serializeProgress({ ...event, args: [4], order: event.order - 1 }));
  assert.equal(journal.read().data.xp, 5);
  storage.removeItem(first.key);
  assert.equal(journal.read().data.xp, 4);
  const { integrity: baseIntegrity, ...base } = JSON.parse(storage.getItem(`${STORAGE_KEY}:base`));
  storage.setItem(
    `${STORAGE_KEY}:base`,
    serializeProgress({ ...base, progress: { ...emptyProgress(), xp: 20 } }),
  );
  assert.equal(journal.read().data.xp, 24);
  assert.deepEqual(batches, [0, 1, 2, 2, 1, 1]);
  storage.setItem(earlier, 'corrupt');
  assert.throws(() => journal.read());
  assert.equal(storage.getItem(earlier), 'corrupt');
});

test('Answer batches and round logs omit teaching content while preserving results across reloads', () => {
  const storage = memoryStorage();
  const repo = createProgressRepository(storage);
  const outcomes = questions.slice(0, 3).map((question) => ({
    question,
    correct: true,
    difficulty: 'hard',
  }));
  repo.recordAnswers(outcomes, 'exam');
  repo.recordRound({ kind: 'exam', total: 3, correct: 3, xp: 60, difficulty: 'hard', outcomes });
  const entries = storage.writes
    .filter((key) => key.startsWith(JOURNAL_PREFIX))
    .map((key) => JSON.parse(storage.getItem(key)));
  for (const outcome of entries[0].args[0])
    assert.deepEqual(outcome.question, {
      id: outcomes.find((item) => item.question.id === outcome.question.id).question.id,
      layer: outcomes.find((item) => item.question.id === outcome.question.id).question.layer,
    });
  assert.equal(entries[1].args[0].outcomes, undefined);
  assert.deepEqual(createProgressRepository(storage).data, repo.data);
  assert.equal(repo.data.xp, 60);
  assert.equal(storage.writes.filter((key) => key === STORAGE_KEY).length, 2);
});

test('Legacy full-question operations mix with compact new operations without duplicated XP', () => {
  const storage = memoryStorage();
  const repo = createProgressRepository(storage, { now: () => 10000 });
  const base = JSON.parse(storage.getItem(`${STORAGE_KEY}:base`));
  const question = questions[0];
  storage.setItem(
    JOURNAL_PREFIX + 'legacy',
    serializeProgress({
      epoch: base.epoch,
      method: 'recordAnswer',
      args: [{ question, correct: true, difficulty: 'normal' }, 'function'],
      time: 1000,
      order: 1000 * 1024,
    }),
  );
  repo.recordAnswer({ question, correct: true, difficulty: 'hard' }, 'function');
  assert.equal(repo.data.xp, 28);
  assert.equal(repo.data.stats[question.id].seen, 2);
  assert.deepEqual(createProgressRepository(storage).data, repo.data);
});

test('Compacted logs never probe thousands of already-deleted applied operation IDs', () => {
  const storage = memoryStorage();
  const applied = Array.from({ length: 4000 }, (_, i) => JOURNAL_PREFIX + i);
  storage.setItem(
    `${STORAGE_KEY}:base`,
    serializeProgress({ progress: emptyProgress(), applied, epoch: 'compacted' }),
  );
  let reads = 0;
  const getItem = storage.getItem;
  storage.getItem = (key) => {
    reads++;
    return getItem(key);
  };
  const journal = createProgressJournal(storage, emptyProgress(), (base) => base);
  reads = 0;
  journal.read();
  journal.read();
  assert.equal(reads, 4);
});
