import { QuizSession } from '../src/domain/quiz-session.js';
import { questions } from '../src/data/questions/index.js';
import { resultView } from '../src/features/play/result.js';
import { parseRoute } from '../src/app/router.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressRepository } from '../src/services/progress-repository.js';
import { emptyProgress, parseBackup, STORAGE_KEY } from '../src/services/progress-schema.js';
import { serializeProgress } from '../src/services/progress-integrity.js';
import { assertSafeStructure } from '../src/services/safe-data.js';
import { html, raw } from '../src/components/html.js';
import { safeLink } from '../src/services/links.js';
import { parseChallenge, createChallenge } from '../src/domain/class-challenge.js';
import { allowsPrefetch } from '../src/services/idle.js';
function storage(value) {
  return {
    value,
    writes: 0,
    getItem() {
      return this.value;
    },
    setItem(key, next) {
      assert.equal(key, STORAGE_KEY);
      this.writes++;
      this.value = next;
    },
  };
}
test('Unreadable progress is retained through every automatic persistence path; explicit recovery unlocks writes', () => {
  for (const original of [
    '',
    '{broken',
    JSON.stringify({ ...emptyProgress(), integrity: { algorithm: 'fnv1a32', value: '00000000' } }),
    'null',
    JSON.stringify({ ...emptyProgress(), stats: [] }),
  ]) {
    const saved = storage(original),
      repo = createProgressRepository(saved);
    assert.equal(repo.storageIssue, 'corrupt');
    assert.equal(repo.originalProgress, original);
    repo.setDifficulty('hard');
    repo.setRadarLevel('normal');
    repo.setRead('basics');
    repo.rememberLesson('basics');
    repo.rateCard('card-1', true);
    repo.rememberActivity('function', { difficulty: 'hard' });
    repo.recordOrder({ correct: true, layer: 1 });
    repo.recordRound({ kind: 'order', total: 7, correct: 3, xp: 0 });
    repo.clearHistory();
    assert.equal(saved.value, original);
    assert.equal(saved.writes, 0);
    assert.ok(JSON.parse(repo.export()).read.includes('basics'));
    assert.throws(() => repo.restore(null));
    assert.equal(saved.value, original);
    const tampered = JSON.parse(serializeProgress(emptyProgress()));
    tampered.xp = 99;
    assert.throws(() => repo.restore(tampered));
    assert.equal(saved.value, original);
    repo.restore({ ...emptyProgress(), xp: 42 });
    assert.equal(repo.storageIssue, null);
    assert.equal(parseBackup(saved.value).xp, 42);
  }
  const saved = storage('{broken'),
    repo = createProgressRepository(saved);
  repo.reset();
  assert.equal(parseBackup(saved.value).xp, 0);
});
test('Storage read failure cannot overwrite original; transient quota writes recover with visible status', () => {
  const saved = storage('private');
  saved.getItem = () => {
    throw Error('denied');
  };
  const repo = createProgressRepository(saved);
  repo.setDifficulty('hard');
  assert.equal(saved.writes, 0);
  const status = [],
    ordinary = storage(null),
    write = ordinary.setItem;
  ordinary.setItem = () => {
    throw new DOMException('full', 'QuotaExceededError');
  };
  const retry = createProgressRepository(ordinary, { onStatusChange: (s) => status.push(s) });
  retry.setDifficulty('hard');
  assert.equal(retry.storageIssue, 'quota');
  ordinary.setItem = write;
  retry.setRead('basics');
  assert.equal(retry.persistent, true);
  assert.deepEqual(status, ['quota', null]);
  assert.equal(parseBackup(ordinary.value).difficulty, 'hard');
});
test('Legacy backups remain compatible; checksums detect edits and names/history respect privacy', () => {
  const saved = storage(null),
    repo = createProgressRepository(saved);
  repo.restore({ ...emptyProgress(), xp: 80 });
  repo.recordRound({
    kind: 'duel',
    total: 7,
    correct: 5,
    xp: 0,
    players: [
      { name: 'Ana', correct: 5, total: 7 },
      { name: 'Luis', correct: 2, total: 7 },
    ],
  });
  assert.deepEqual(
    JSON.parse(repo.export()).history[0].players.map((p) => p.name),
    ['Jugador A', 'Jugador B'],
  );
  assert.equal(parseBackup(repo.export({ includeHistory: false })).history.length, 0);
  repo.clearHistory();
  assert.equal(repo.data.xp, 80);
  assert.equal(repo.data.history.length, 0);
  const edited = JSON.parse(repo.export());
  edited.xp++;
  assert.throws(() => parseBackup(JSON.stringify(edited)), /integridad|modificad|control/i);
});
test('Parser rejects dangerous keys, depth, byte excess, circular structures, while accepting shared ordinary references', () => {
  for (const key of ['__proto__', 'constructor', 'prototype'])
    assert.throws(() => parseBackup(`{"version":3,"read":[],"stats":{},"${key}":{}}`));
  let nested = {};
  for (let i = 0; i < 26; i++) nested = { child: nested };
  assert.throws(() => assertSafeStructure(nested));
  const cycle = {};
  cycle.child = cycle;
  assert.throws(() => assertSafeStructure(cycle));
  const shared = { ok: true };
  assert.doesNotThrow(() => assertSafeStructure({ a: shared, b: shared }));
  assert.throws(() => parseBackup('😀'.repeat(500001)), /2 MB/);
  for (const stats of [true, 8, [], 'bad'])
    assert.throws(() => parseBackup(JSON.stringify({ ...emptyProgress(), stats })));
  assert.equal({}.polluted, undefined);
});
test('Escaping is the default and link schemes are explicit; prefetch respects slow connections', () => {
  assert.equal(html`<p>${'<img onerror="bad">'}</p>`, '<p>&lt;img onerror=&quot;bad&quot;&gt;</p>');
  assert.equal(html`<p>${raw('<strong>OK</strong>')}</p>`, '<p><strong>OK</strong></p>');
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'vbscript:bad'])
    assert.throws(() => safeLink(url));
  assert.equal(safeLink('https://example.org'), 'https://example.org/');
  assert.equal(allowsPrefetch({ saveData: true }), false);
  assert.equal(allowsPrefetch({ effectiveType: '2g' }), false);
  assert.equal(allowsPrefetch({ effectiveType: '4g' }), true);
});
test('Deterministic malformed input corpus exercises backup and class parsers without state pollution', () => {
  let state = 123456;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const atoms = [
    null,
    true,
    7,
    '\ud800',
    '😀',
    '__proto__',
    {},
    [],
    { version: 3, read: [], stats: {} },
  ];
  for (let i = 0; i < 500; i++) {
    const value = atoms[random() % atoms.length];
    const input =
      random() % 2 ? JSON.stringify(value) : String(value) + String.fromCharCode(random() % 65536);
    let parsed, challenge;
    try {
      parsed = parseBackup(input);
    } catch (error) {
      assert.ok(error instanceof Error);
    }
    if (parsed) {
      assert.equal(parsed.version, 3);
      assert.ok(Array.isArray(parsed.read));
    }
    try {
      challenge = parseChallenge(input);
    } catch (error) {
      assert.ok(error instanceof Error);
    }
    if (challenge) assert.equal(createChallenge(challenge).code, challenge.code);
    const route = parseRoute('#/' + input);
    assert.ok(Array.isArray(route) && route.every((part) => typeof part === 'string'));
  }
  assert.equal({}.polluted, undefined);
});

test('Route parser bounds oversized hashes and safely rejects broken Unicode escapes', () => {
  assert.deepEqual(parseRoute('#/study/url/1'), ['study', 'url', '1']);
  assert.deepEqual(parseRoute('#/%E0%A4'), ['not-found']);
  assert.deepEqual(parseRoute('#/' + 'x'.repeat(2049)), ['not-found']);
  assert.deepEqual(parseRoute('#/a/b/c/d/e'), ['not-found']);
});

test('Finished mistake reviews compose actual study links instead of displaying escaped anchors', () => {
  const session = new QuizSession(questions.slice(0, 3));
  while (!session.done) {
    session.answer(
      session.options[session.index].find((index) => index !== session.current.correctIndex),
    );
    session.next();
  }
  const view = resultView({ activity: session });
  assert.match(view.html, /<a href="#\/study\/layer-[1-7]" class="text-link">Entender la capa/);
  assert.doesNotMatch(view.html, /&lt;a href=/);
});
