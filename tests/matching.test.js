import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchingSession } from '../src/domain/matching-session.js';

const deterministic = () => 0.2;

test('matching selects one task per layer and restricts the chosen difficulty', () => {
  for (const difficulty of ['normal', 'hard']) {
    const session = new MatchingSession({ difficulty, random: deterministic });
    assert.equal(session.cards.length, 7);
    assert.equal(new Set(session.cards.map((card) => card.layer)).size, 7);
    assert.equal(
      session.cards.every((card) => card.difficulty === difficulty),
      true,
    );
    assert.equal(session.layerOrder.length, 7);
    assert.equal(session.done, false);
  }
});

test('matching accepts selection in both directions and cannot award a pair twice', () => {
  const session = new MatchingSession({ random: deterministic });
  const [first, second] = session.cards;
  assert.equal(session.selectTask(first.id), null);
  const outcome = session.selectLayer(first.layer);
  assert.equal(outcome.correct, true);
  assert.equal(outcome.xp, 8);
  assert.equal(session.pair(first.id, first.layer), null);
  assert.equal(session.selectTask(first.id), null);
  assert.equal(session.selectLayer(second.layer), null);
  assert.equal(session.selectTask(second.id).layer, second.layer);
  assert.equal(session.result.xp, 16);
  assert.equal(session.result.correct, 2);
});

test('a wrong pairing offers an explanation, allows retry and affects only that task', () => {
  const session = new MatchingSession({ difficulty: 'hard', random: deterministic });
  const [first, second] = session.cards;
  assert.equal(session.pair(first.id, second.layer), null);
  assert.equal(session.feedback.correct, false);
  assert.equal(session.feedback.explanation, first.explanation);
  assert.equal(session.matched.length, 0);
  assert.equal(session.result.xp, 0);
  const assisted = session.pair(first.id, first.layer);
  assert.equal(assisted.assisted, true);
  assert.equal(assisted.xp, 10);
  const independent = session.pair(second.id, second.layer);
  assert.equal(independent.assisted, false);
  assert.equal(independent.xp, 20);
  assert.equal(session.result.correct, 1);
});

test('a hint discounts its task without reducing the reward for other connections', () => {
  const session = new MatchingSession({ random: deterministic });
  const [first, second] = session.cards;
  assert.equal(session.hint(first.id), true);
  assert.equal(session.hinted.has(first.id), true);
  assert.equal(session.pair(first.id, first.layer).xp, 4);
  assert.equal(session.pair(second.id, second.layer).xp, 8);
  assert.equal(session.hint(first.id), false);
  assert.equal(session.hint('invalid-id'), false);
});

test('complete matching rounds produce accurate results with difficulty rewards', () => {
  for (const [difficulty, totalXP] of [
    ['normal', 56],
    ['hard', 140],
  ]) {
    const session = new MatchingSession({ difficulty, random: deterministic });
    session.cards.forEach((card) => session.pair(card.id, card.layer));
    assert.equal(session.done, true);
    assert.equal(session.result.kind, 'matching');
    assert.equal(session.result.total, 7);
    assert.equal(session.result.correct, 7);
    assert.equal(session.result.xp, totalXP);
    assert.equal(session.result.outcomes.length, 7);
    assert.equal(session.pair(session.cards[0].id, session.cards[0].layer), null);
    assert.equal(session.hint(session.cards[0].id), false);
  }
});

test('invalid targets and already occupied layers cannot change a matching round', () => {
  const session = new MatchingSession({ random: deterministic });
  const [first, second] = session.cards;
  assert.equal(session.pair('unknown', 1), null);
  assert.equal(session.pair(first.id, 9), null);
  session.pair(first.id, first.layer);
  assert.equal(session.pair(second.id, first.layer), null);
  assert.equal(session.assisted.has(second.id), false);
  assert.equal(session.result.xp, 8);
});
