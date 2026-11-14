import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../src/features/play/session-factory.js';
import { emptyProgress } from '../src/services/progress-schema.js';
import { SpeedrunSession } from '../src/domain/speedrun-session.js';
import { roundItems } from '../src/domain/round-progress.js';
import { rewardHud } from '../src/components/reward-hud.js';
import { resultView } from '../src/features/play/result.js';
import { seededRandom } from '../src/domain/random.js';
import { externalLink } from '../src/components/external-link.js';

for (const difficulty of ['normal', 'hard'])
  test(`Sprint ${difficulty} continues through three seeded bank cycles with independent attempts`, () => {
    let now = 0;
    const initial = createSession('speedrun', { difficulty, seed: 'recycling' }, emptyProgress());
    const make = () =>
      new SpeedrunSession(initial.questions, {
        difficulty,
        random: seededRandom('cycles'),
        now: () => now,
      });
    const a = make(),
      b = make();
    a.setActive(true);
    b.setActive(true);
    const bankSize = a.questions.length;
    const expected = [];
    for (let i = 0; i < bankSize * 3 + 1; i++) {
      assert.equal(a.current.id, b.current.id);
      assert.deepEqual(a.options[a.index], b.options[b.index]);
      const question = a.current;
      if (i && i % bankSize === 0) assert.notEqual(question.id, expected.at(-1).question.id);
      now += 100;
      const choice =
        i % 5 === 0
          ? a.options[a.index].find((c) => c !== question.correctIndex)
          : question.correctIndex;
      const answer = a.answer(choice);
      b.answer(choice);
      expected.push(answer);
      const remaining = a.remainingMs;
      assert.equal(a.answer(choice), null, 'Double click does not add an attempt or bonus');
      assert.equal(a.remainingMs, remaining);
      assert.equal(a.attempts.length, i + 1);
      assert.equal(a.attemptNumber, i + 1);
      assert.ok(a.next());
      b.next();
      assert.equal(a.done, false);
      assert.equal(a.currentAnswer, undefined);
      assert.equal(a.next(), false, 'Cannot skip an unanswered recycled question');
      assert.ok(roundItems(a).length <= 8);
      assert.equal(roundItems(a).at(-1).status, 'pending');
    }
    const xp = expected.reduce((sum, o) => sum + o.xp, 0);
    assert.ok(rewardHud(a).includes(`${xp} XP`), 'HUD retains XP across cycles');
    assert.deepEqual(a.result.outcomes, expected);
    assert.equal(a.result.xp, xp);
    assert.equal(a.result.correct, expected.filter((o) => o.correct).length);
    assert.equal(new Set(a.result.missedIds).size, a.result.missedIds.length);
    a.setActive(false);
    const remaining = a.remainingMs;
    now += 999999;
    assert.equal(a.remainingMs, remaining);
    a.setActive(true);
    now += remaining + 1;
    assert.equal(a.answer(a.current.correctIndex), null);
    assert.equal(a.done, true);
    assert.equal(a.finishReason, 'time');
    assert.equal(a.result.total, expected.length);
    assert.equal(a.next(), false);
    assert.equal(a.result.xp, xp);
  });

test('Single-question Sprint can recycle and practice-only results and HUD remain XP-free', () => {
  const original = createSession('speedrun', { seed: 'one' }, emptyProgress()).questions[0];
  const s = new SpeedrunSession([original], { now: () => 0 });
  s.practiceOnly = true;
  for (let i = 0; i < 5; i++) {
    assert.equal(s.answer(original.correctIndex).xp, 0);
    assert.ok(s.next());
  }
  assert.equal(s.result.total, 5);
  assert.equal(s.result.xp, 0);
  assert.match(rewardHud(s), /sin XP/);
});

test('Survival distinguishes loss of lives from a successful completed round', () => {
  const lost = createSession('survival', { seed: 'loss' }, emptyProgress());
  for (let i = 0; i < 3; i++) {
    lost.answer(lost.options[lost.index].find((c) => c !== lost.current.correctIndex));
    lost.next();
  }
  assert.equal(lost.result.finishReason, 'lives');
  const lossView = resultView({ activity: lost }).html;
  assert.match(lossView, /SIN VIDAS/);
  assert.match(lossView, /Te has quedado sin vidas/);
  assert.doesNotMatch(lossView, /RETO COMPLETADO|result-medal[^>]*>✧/);
  const win = createSession('survival', { seed: 'win' }, emptyProgress());
  while (!win.done) {
    win.answer(win.current.correctIndex);
    win.next();
  }
  assert.match(resultView({ activity: win }).html, /RETO COMPLETADO/);
  assert.doesNotMatch(resultView({ activity: win }).html, /SIN VIDAS/);
});

test('Reference component requires language, escapes labels and announces a protected new tab', () => {
  const link = externalLink({
    url: 'https://example.org',
    title: '<img onerror=x>',
    language: 'en',
  });
  assert.match(link, /Inglés/);
  assert.match(link, /se abre en otra pestaña/);
  assert.match(link, /rel="noopener noreferrer"/);
  assert.match(link, /&lt;img/);
  assert.throws(() => externalLink({ url: 'https://example.org', title: 'Missing' }), /idioma/);
  assert.throws(
    () => externalLink({ url: 'javascript:alert(1)', title: 'Bad', language: 'es' }),
    /permitida/,
  );
});
