import test from 'node:test';
import assert from 'node:assert/strict';
import { seededRandom } from '../src/domain/random.js';
import { classModes } from '../src/data/class-modes.js';
import {
  createChallenge,
  parseChallenge,
  challengeOptions,
  challengeLink,
  CLASS_REVISION,
} from '../src/domain/class-challenge.js';
import { createSession } from '../src/features/play/session-factory.js';

const empty = { stats: {}, cards: {} };
function layout(session) {
  if (session.type === 'quiz')
    return {
      questions: session.questions.map((question) => question.id),
      options: session.options,
    };
  if (session.type === 'matching')
    return { tasks: session.cards.map((task) => task.id), layers: session.layerOrder };
  if (session.type === 'packet')
    return session.options.map((options) => options.map((choice) => choice.id));
  return { bank: session.bank, targets: session.targets };
}

test('Seeded random streams repeat exactly and stay in the shuffle range', () => {
  const reference = seededRandom('CLASE1');
  assert.deepEqual(
    Array.from({ length: 6 }, () => reference()),
    [
      0.9503250294364989, 0.29843241907656193, 0.13072614860720932, 0.32959207659587264,
      0.2847621978726238, 0.7312359032221138,
    ],
    'Existing class codes must retain their random sequence',
  );
  const first = seededRandom('CLASE1');
  const second = seededRandom('CLASE1');
  for (let index = 0; index < 1000; index++) {
    const value = first();
    assert.equal(value, second());
    assert.ok(value >= 0 && value < 1);
  }
  assert.notEqual(seededRandom('CLASE1')(), seededRandom('CLASE2')());
});

test('Every class activity and level encodes and decodes its full configuration', () => {
  for (const mode of classModes) {
    for (const difficulty of mode.kind === 'cases' ? ['normal'] : ['normal', 'hard']) {
      const challenge = createChallenge({ mode: mode.id, difficulty, seed: ' clase1 ' });
      assert.equal(challenge.seed, 'CLASE1');
      assert.deepEqual(parseChallenge(challenge.code.toLowerCase()), challenge);
      assert.equal(challenge.direction, mode.direction);
      assert.equal(challenge.caseId, mode.caseId);
    }
  }
});

test('Same code reproduces all questions, choices, cards and directions independently of personal progress', () => {
  for (const mode of classModes) {
    for (const difficulty of mode.kind === 'cases' ? ['normal'] : ['normal', 'hard']) {
      const challenge = createChallenge({ mode: mode.id, difficulty, seed: 'GRUPO5' });
      const first = createSession(challenge.kind, challengeOptions(challenge), empty);
      const second = createSession(
        challenge.kind,
        challengeOptions(parseChallenge(challenge.code)),
        { stats: { 'function-1': { due: 0, wrong: 8 } }, cards: { old: { due: 0 } } },
      );
      assert.deepEqual(layout(first), layout(second), `${mode.id}/${difficulty}`);
      assert.equal(first.difficulty, difficulty);
      if (first.type === 'quiz') {
        first.answer(first.options[0][0]);
        assert.deepEqual(second.answers, {}, 'Participants never share answers');
      }
    }
  }
});

test('Changing a seed changes question and answer layouts while reopening starts fresh', () => {
  const make = (seed) => {
    const challenge = createChallenge({ mode: 'EXA', difficulty: 'hard', seed });
    return createSession(challenge.kind, challengeOptions(challenge), empty);
  };
  const first = make('CLASE1');
  assert.notDeepEqual(layout(first), layout(make('CLASE2')));
  first.answer(first.options[0][0]);
  first.next();
  const reopened = make('CLASE1');
  assert.deepEqual(layout(first), layout(reopened));
  assert.equal(reopened.index, 0);
  assert.deepEqual(reopened.answers, {});
});

test('Codes reject incompatible banks, invalid levels, personal modes and malformed input', () => {
  const challenge = createChallenge({ seed: 'CLASE1' });
  const other = CLASS_REVISION === '00000000' ? 'FFFFFFFF' : '00000000';
  assert.throws(
    () => parseChallenge(challenge.code.replace(CLASS_REVISION, other)),
    /otra versión/,
  );
  for (const value of [
    '',
    '<script>',
    'OSI2-FUN-N-CLASE1-12345678',
    'https://example.com/#/play',
    'x'.repeat(2049),
  ])
    assert.throws(() => parseChallenge(value));
  for (const mode of ['adaptive', 'flashcards', 'XXX'])
    assert.throws(() => createChallenge({ mode, seed: 'CLASE1' }));
  for (const seed of ['', 'two words', '<img>', 'x'.repeat(25), 'á'])
    assert.throws(() => createChallenge({ seed }));
  assert.throws(() => createChallenge({ difficulty: 'easy', seed: 'CLASE1' }));
  assert.throws(() => createChallenge({ mode: 'CAS1', difficulty: 'hard', seed: 'CLASE1' }));
  assert.throws(() => parseChallenge(`OSI2-CAS1-D-CLASE1-${CLASS_REVISION}`));
});

test('Links work under a published repository prefix and import as full links or hashes', () => {
  const challenge = createChallenge({ mode: 'ORE', difficulty: 'hard', seed: 'A1' });
  const link = challengeLink(challenge.code, 'https://example.com/osi-quest/?preview=1#/play');
  assert.equal(link, `https://example.com/osi-quest/#/class/${challenge.code}`);
  assert.deepEqual(parseChallenge(link), challenge);
  assert.deepEqual(parseChallenge(new URL(link).hash), challenge);
});

test('Previous classroom format is rejected with an explicit migration message', () => {
  assert.throws(() => parseChallenge(`OSI1-FUN-N-CLASE1-${CLASS_REVISION}`), /banco anterior/);
});

test('Shared challenge links reject executable and data URL bases', () => {
  const challenge = createChallenge({ mode: 'FUN', seed: 'CLASE' });
  assert.throws(() => challengeLink(challenge.code, 'javascript:alert(1)'));
  assert.throws(() => challengeLink(challenge.code, 'data:text/html,test'));
});
