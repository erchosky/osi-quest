import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressRepository } from '../src/services/progress-repository.js';
import { sanitizeProgress, emptyProgress, STORAGE_KEY } from '../src/services/progress-schema.js';
import { questions } from '../src/data/questions/index.js';
import { serializeProgress } from '../src/services/progress-integrity.js';
function storage() {
  const map = new Map();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}
test('Independent tabs preserve lessons, additive XP, same-question answers and explicit unread/reset/import', () => {
  const disk = storage(),
    a = createProgressRepository(disk),
    b = createProgressRepository(disk);
  a.markRead('basics');
  b.markRead('layer-1');
  const q = questions[0];
  a.recordAnswer({ question: q, correct: true, difficulty: 'normal' }, 'function');
  b.recordAnswer({ question: q, correct: true, difficulty: 'hard' }, 'function');
  a.synchronize();
  b.synchronize();
  assert.deepEqual(a.data, b.data);
  assert.equal(a.data.xp, 28);
  assert.equal(a.data.stats[q.id].seen, 2);
  assert.deepEqual(new Set(a.data.read), new Set(['basics', 'layer-1']));
  a.setRead('basics', false);
  b.markRead('layer-2');
  assert.deepEqual(
    new Set(createProgressRepository(disk).data.read),
    new Set(['layer-1', 'layer-2']),
  );
  a.reset();
  b.markRead('layer-3');
  assert.equal(createProgressRepository(disk).data.xp, 0);
  assert.deepEqual(createProgressRepository(disk).data.read, ['layer-3']);
  a.restore({ ...emptyProgress(), xp: 42, read: ['basics'] });
  b.markRead('layer-4');
  const loaded = createProgressRepository(disk);
  assert.equal(loaded.data.xp, 42);
  assert.deepEqual(new Set(loaded.data.read), new Set(['basics', 'layer-4']));
  assert.equal(JSON.parse(disk.getItem(STORAGE_KEY)).xp, 42);
});
test('A stale whole snapshot never erases uniquely appended operations', () => {
  const disk = storage(),
    a = createProgressRepository(disk),
    stale = a.export();
  a.markRead('basics');
  disk.setItem(STORAGE_KEY, stale);
  const b = createProgressRepository(disk);
  assert.deepEqual(b.data.read, ['basics']);
  b.markRead('unknown');
  assert.deepEqual(b.data.read, ['basics']);
});
test('Journal replay is idempotent over reloads and preserves batched exam timestamps', () => {
  const disk = storage(),
    a = createProgressRepository(disk);
  a.recordAnswers(
    questions.slice(0, 3).map((question) => ({ question, correct: true })),
    'exam',
  );
  const first = a.data;
  for (let i = 0; i < 3; i++) assert.deepEqual(createProgressRepository(disk).data, first);
  assert.equal(first.xp, 24);
});
test('Future imports have bounded review and cooldown dates; notes validate lesson IDs and remain plain text', () => {
  const now = Date.now(),
    far = 8.64e15;
  const clean = sanitizeProgress({
    ...emptyProgress(),
    stats: { [questions[0].id]: { seen: 1, correct: 1, due: far, last: far } },
    recoveryRewards: { 'function-1': far },
    concepts: { 'tcp-security': { retryAfter: far } },
  });
  assert.ok(clean.stats[questions[0].id].due <= now + 60 * 86400000 + 100);
  assert.ok(clean.stats[questions[0].id].last <= Date.now());
  assert.ok(clean.concepts['tcp-security'].retryAfter <= now + 600100);
  const repo = createProgressRepository(storage());
  repo.saveLessonNote('basics', '<script>personal note</script>');
  repo.saveLessonNote('unknown', 'x');
  assert.equal(JSON.parse(repo.export()).lessonNotes.basics, '<script>personal note</script>');
  assert.equal(repo.data.lessonNotes.unknown, undefined);
});

test('Quota failure keeps pending answers in memory and retries them exactly once', () => {
  const disk = storage(),
    originalSet = disk.setItem;
  let full = false;
  disk.setItem = (key, value) => {
    if (full) {
      const e = new Error('full');
      e.name = 'QuotaExceededError';
      throw e;
    }
    originalSet(key, value);
  };
  const repo = createProgressRepository(disk),
    q = questions[0];
  full = true;
  repo.recordAnswer({ question: q, correct: true }, 'function');
  repo.markRead('basics');
  assert.equal(repo.data.xp, 8);
  assert.ok(repo.data.read.includes('basics'));
  assert.equal(repo.storageIssue, 'quota');
  full = false;
  repo.markRead('layer-1');
  const reloaded = createProgressRepository(disk);
  assert.equal(reloaded.data.xp, 8);
  assert.deepEqual(new Set(reloaded.data.read), new Set(['basics', 'layer-1']));
});
test('Same-millisecond sequential reset and actions have a stable logical order', () => {
  const disk = storage(),
    a = createProgressRepository(disk, { now: () => 10000 });
  a.markRead('basics');
  a.reset();
  a.markRead('layer-1');
  a.markRead('layer-2');
  assert.deepEqual(createProgressRepository(disk).data.read, ['layer-1', 'layer-2']);
});
test('Corrupt journal is retained until explicit recovery, then saving works across reload', () => {
  const disk = storage(),
    a = createProgressRepository(disk);
  a.markRead('basics');
  disk.setItem('osi-quest-v1:base', 'broken');
  const broken = createProgressRepository(disk);
  assert.equal(broken.storageIssue, 'corrupt');
  broken.markRead('layer-1');
  assert.equal(disk.getItem('osi-quest-v1:base'), 'broken');
  broken.reset();
  broken.markRead('layer-2');
  assert.deepEqual(createProgressRepository(disk).data.read, ['layer-2']);
});

test('Revised non-layer questions have fewer length cues and complete review metadata', () => {
  const nonLayer = questions.filter((q) => !q.layerQuestion);
  const longest = nonLayer.filter(
    (q) =>
      q.choices[q.correctIndex].length >
      Math.max(...q.choices.filter((_, i) => i !== q.correctIndex).map((s) => s.length)),
  ).length;
  assert.ok(longest / nonLayer.length < 0.4);
  for (const q of questions) {
    assert.ok(q.choices.length >= 4 && q.choices.length <= 7);
    assert.ok(q.sources.length);
    assert.match(q.review.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Set(q.choices).size, q.choices.length);
  }
});

test('Interrupted journal compaction does not count already applied answers twice', async () => {
  const disk = storage(),
    remove = disk.removeItem;
  let fail = true;
  disk.removeItem = (key) => {
    if (fail && key.includes(':operation:')) {
      fail = false;
      throw new Error('interrupted');
    }
    remove(key);
  };
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'locks');
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: { request: async (name, options, run) => run({ name }) },
  });
  try {
    const repo = createProgressRepository(disk, { now: () => 1000 });
    for (let i = 0; i < 256; i++)
      repo.recordActivity({ layer: 1, correct: true, difficulty: 'normal' }, 'packet');
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(createProgressRepository(disk).data.xp, 256 * 8);
  } finally {
    if (descriptor) Object.defineProperty(navigator, 'locks', descriptor);
    else delete navigator.locks;
  }
});
