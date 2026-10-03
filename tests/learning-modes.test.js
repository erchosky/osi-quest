import test from 'node:test';
import assert from 'node:assert/strict';
import { ActivityClock } from '../src/domain/activity-clock.js';
import { SurvivalSession } from '../src/domain/survival-session.js';
import { DuelSession } from '../src/domain/duel-session.js';
import { QuizSession } from '../src/domain/quiz-session.js';
import { PacketSession } from '../src/domain/packet-session.js';
import { MatchingSession } from '../src/domain/matching-session.js';
import { OrderSession } from '../src/domain/order-session.js';
import { createSession } from '../src/features/play/session-factory.js';
import { questions, learningQuestions } from '../src/data/questions/index.js';
import { misconceptions, misconceptionQuestions } from '../src/data/misconceptions.js';
import { recordConcept } from '../src/domain/concept-badges.js';
import { layerMastery } from '../src/domain/mastery.js';
import { historicalAverage, layerFailures, buildRoundReport } from '../src/domain/round-report.js';
import { retryOptions } from '../src/domain/retry-options.js';
import { createProgressRepository } from '../src/services/progress-repository.js';
import { parseBackup, sanitizeProgress } from '../src/services/progress-schema.js';

const pool = questions.filter((question) => !question.layerQuestion).slice(0, 6);
const correct = (session) => session.current.correctIndex;
const wrong = (session) =>
  session.options[session.index].find((index) => index !== correct(session));

test('Active clocks exclude navigation and pauses and freeze permanently at completion', () => {
  let now = 0;
  const clock = new ActivityClock(() => now);
  clock.setActive(true);
  now = 1200;
  clock.setActive(false);
  now = 50000;
  assert.equal(clock.elapsedMs, 1200);
  clock.setActive(true);
  now += 800;
  assert.equal(clock.stop(), 2000);
  now += 50000;
  clock.setActive(true);
  assert.equal(clock.stop(), 2000);
});

test('Survival loses one life per wrong answer, permits explanations and ends at three losses', () => {
  const session = new SurvivalSession(pool);
  for (let lives = 2; lives >= 0; lives--) {
    assert.equal(session.answer(wrong(session)).correct, false);
    assert.equal(session.lives, lives);
    assert.equal(session.answer(correct(session)), null);
    assert.equal(session.done, false, 'Feedback remains available before finishing');
    session.next();
  }
  assert.equal(session.done, true);
  assert.equal(session.next(), false);
  assert.equal(session.result.total, 3);
  assert.equal(session.result.planned, 6);
  assert.equal(session.result.xp, 0);
  assert.equal(session.result.finishReason, 'lives');
});

test('Survival hints discount rewards without taking a life; successful completion uses all questions', () => {
  const session = new SurvivalSession(pool.slice(0, 2), { difficulty: 'hard' });
  assert.equal(session.hint(), true);
  assert.equal(session.answer(correct(session)).xp, 10);
  assert.equal(session.lives, 3);
  session.next();
  assert.equal(session.answer(correct(session)).xp, 20);
  session.next();
  assert.equal(session.result.xp, 30);
  assert.equal(session.result.correct, 1);
  assert.equal(session.result.finishReason, 'complete');
});

test('Countdown expiration wins a deadline race and can only take a life once', () => {
  let now = 0;
  const session = new SurvivalSession(pool, { timed: true, now: () => now });
  session.setActive(true);
  now = 30000;
  assert.equal(session.answer(correct(session)).timedOut, true);
  assert.equal(session.lives, 2);
  assert.equal(session.tick(), null);
  assert.equal(session.answer(correct(session)), null);
  session.next();
  assert.equal(session.remainingMs, 30000);
  now += 30000;
  assert.equal(session.tick().timedOut, true);
  assert.equal(session.lives, 1);
});

test('Pauses, hidden screens and feedback stop the countdown', () => {
  let now = 0;
  const session = new SurvivalSession(pool, { timed: true, now: () => now });
  session.setActive(true);
  now = 5000;
  session.togglePause();
  now = 90000;
  assert.equal(session.remainingMs, 25000);
  assert.equal(session.answer(correct(session)), null);
  session.togglePause();
  session.setActive(false);
  now += 50000;
  assert.equal(session.remainingMs, 25000);
  session.setActive(true);
  session.answer(correct(session));
  const remaining = session.remainingMs;
  now += 50000;
  assert.equal(session.remainingMs, remaining);
  assert.equal(session.tick(), null);
});

test('Survival factory supplies twenty unique questions and timer is opt-in', () => {
  for (const difficulty of ['normal', 'hard']) {
    const session = createSession('survival', { difficulty }, { stats: {}, cards: {} });
    assert.equal(session.questions.length, 20);
    assert.equal(new Set(session.questions.map((question) => question.id)).size, 20);
    assert.equal(
      new Set(
        session.questions.filter((question) => question.layer).map((question) => question.layer),
      ).size,
      7,
    );
    assert.equal(session.timed, false);
  }
});

test('Duel isolates turns, delays reveal until both answer and alternates first player', () => {
  const session = new DuelSession(pool.slice(0, 2), { names: ['Ana', 'Luis'], seed: 'TEST' });
  assert.equal(session.answer(correct(session)), null);
  assert.equal(session.playerIndex, 0);
  assert.deepEqual(session.players[0].options, session.players[1].options);
  session.beginTurn();
  session.answer(correct(session));
  assert.equal(session.phase, 'handoff');
  assert.equal(session.playerIndex, 1);
  assert.equal(session.outcomes[1], undefined);
  assert.equal(session.next(), false);
  session.beginTurn();
  session.answer(session.options.find((index) => index !== session.current.correctIndex));
  assert.equal(session.phase, 'reveal');
  session.next();
  assert.equal(session.playerIndex, 1);
  session.beginTurn();
  session.answer(correct(session));
  session.beginTurn();
  session.answer(correct(session));
  session.next();
  assert.equal(session.done, true);
  assert.equal(session.result.xp, 0);
  assert.deepEqual(
    session.result.players.map((player) => player.correct),
    [2, 1],
  );
  assert.equal(session.answer(0), null);
  assert.equal(session.beginTurn(), false);
});

test('Badge probes provide at least four independent questions per misconception', () => {
  assert.ok(misconceptionQuestions.length >= misconceptions.length * 4);
  assert.equal(
    new Set(misconceptionQuestions.map((question) => question.id)).size,
    misconceptionQuestions.length,
  );
  for (const concept of misconceptions) {
    assert.ok(concept.questions.length >= 4);
    for (const question of concept.questions) {
      assert.ok(question.explanation && question.hint && question.choices[question.correctIndex]);
      assert.equal(new Set(question.choices).size, 4);
    }
  }
});

test('Badges require two distinct independent answers; mistakes reset proof without deleting earned badges', () => {
  const [a, b] = misconceptions[0].questions;
  let state = recordConcept(undefined, { question: a, correct: true, assisted: false }, 1000);
  state = recordConcept(state, { question: a, correct: true, assisted: false }, 2000);
  assert.equal(state.earnedAt, null);
  state = recordConcept(state, { question: b, correct: true, assisted: true }, 3000);
  assert.equal(state.proofIds.length, 0);
  state = recordConcept(state, { question: a, correct: true, assisted: false }, 4000);
  state = recordConcept(state, { question: b, correct: true, assisted: false }, 5000);
  assert.equal(state.earnedAt, null, 'Immediate rechecking cannot replace delayed evidence');
  state = recordConcept(state, { question: a, correct: true, assisted: false }, 604000);
  state = recordConcept(state, { question: b, correct: true, assisted: false }, 605000);
  assert.equal(state.earnedAt, 605000);
  state = recordConcept(state, { question: b, correct: false }, 606000);
  assert.equal(state.earnedAt, 605000);
  assert.equal(state.needsReview, true);
});

test('Layer radar discounts little evidence and separates new difficulty statistics', () => {
  const bank = learningQuestions.filter((question) => question.layer === 4).slice(0, 4);
  const stats = {
    [bank[0].id]: { seen: 1, correct: 1, levels: { normal: { seen: 1, correct: 1 } } },
  };
  assert.equal(layerMastery(bank, stats, 4).score, 25);
  assert.equal(layerMastery(bank, stats, 4).limited, true);
  assert.equal(layerMastery(bank, stats, 4, 'hard').attempts, 0);
  bank.forEach((question) => (stats[question.id] = { seen: 3, correct: 3 }));
  assert.equal(layerMastery(bank, stats, 4).score, 100);
  assert.equal(layerMastery(bank, stats, 4).limited, false);
  assert.equal(
    layerMastery(bank, stats, 4, 'normal').score,
    0,
    'Legacy aggregates are never guessed into a difficulty',
  );
});

test('Repository and backups preserve badges, per-level evidence and report fields', () => {
  const store = {
    value: null,
    getItem() {
      return this.value;
    },
    setItem(key, value) {
      this.value = value;
    },
  };
  const repository = createProgressRepository(store);
  for (const question of misconceptions[0].questions)
    repository.recordAnswer(
      { question, correct: true, assisted: false, difficulty: 'normal' },
      'confusions',
    );
  const question = misconceptions[0].questions[0];
  repository.recordAnswer(
    { question, correct: false, assisted: false, difficulty: 'hard' },
    'confusions',
  );
  repository.recordRound({
    kind: 'confusions',
    difficulty: 'normal',
    total: 2,
    correct: 2,
    xp: 16,
    durationMs: 5500,
    failures: [],
    timed: false,
    challengeCode: 'example',
  });
  const restored = parseBackup(repository.export());
  assert.ok(restored.concepts['tcp-security'].earnedAt);
  assert.equal(restored.concepts['tcp-security'].needsReview, true);
  assert.equal(restored.stats[question.id].levels.normal.correct, 1);
  assert.equal(restored.stats[question.id].levels.hard.correct, 0);
  assert.equal(restored.history[0].durationMs, 5500);
  assert.equal(restored.history[0].challengeCode, 'example');
  const invalid = sanitizeProgress({
    concepts: {
      'tcp-security': { earnedAt: 1000, earnedProofIds: ['proof-tcp-1', 'proof-tcp-1'] },
    },
  });
  assert.equal(invalid.concepts['tcp-security'].earnedAt, null);
});

test('Result averages use previous comparable rounds and never include another mode or clock setting', () => {
  const history = [
    { mode: 'survival', difficulty: 'normal', total: 10, correct: 6, timed: false },
    { mode: 'survival', difficulty: 'normal', total: 10, correct: 8, timed: false },
    { mode: 'survival', difficulty: 'normal', total: 10, correct: 0, timed: true },
    { mode: 'survival', difficulty: 'hard', total: 10, correct: 0 },
    { mode: 'exam', difficulty: 'normal', total: 10, correct: 0 },
  ];
  assert.deepEqual(historicalAverage(history, { kind: 'survival', difficulty: 'normal' }), {
    rounds: 2,
    percent: 70,
  });
});

test('Result reports distinguish mistakes, hints, blank answers and elapsed deadlines', () => {
  const failures = layerFailures([
    { question: { layer: 4 }, correct: false, selected: 2 },
    { layer: 4, correct: true, assisted: true },
    { question: { layer: 3 }, selected: null, correct: false },
    { question: { layer: 4 }, selected: null, correct: false, timedOut: true },
  ]);
  assert.deepEqual(failures, [
    { layer: 3, wrong: 0, assisted: 0, unanswered: 1, timedOut: 0 },
    { layer: 4, wrong: 1, assisted: 1, unanswered: 0, timedOut: 1 },
  ]);
  const session = new QuizSession(pool.slice(0, 1));
  session.answer(correct(session));
  session.next();
  assert.equal(buildRoundReport(session, 1234, { rounds: 0, percent: null }).durationMs, 1234);
});

test('Only failed or assisted quiz questions repeat, and duel repeats stay separate from the profile', () => {
  const session = new QuizSession(pool.slice(0, 2));
  session.answer(wrong(session));
  session.next();
  session.answer(correct(session));
  session.next();
  const retry = retryOptions(session);
  assert.deepEqual(retry.options.questionIds, [pool[0].id]);
  const repeated = createSession(retry.kind, retry.options, { stats: {}, cards: {} });
  assert.equal(repeated.questions.length, 1);
  assert.equal(repeated.current.id, pool[0].id);
  const duel = new DuelSession(pool.slice(0, 1));
  duel.beginTurn();
  duel.answer(duel.options.find((index) => index !== duel.current.correctIndex));
  duel.beginTurn();
  duel.answer(correct(duel));
  duel.next();
  const privateRetry = retryOptions(duel, 0);
  assert.equal(privateRetry.options.practiceOnly, true);
  const privateSession = createSession(privateRetry.kind, privateRetry.options, {
    stats: {},
    cards: {},
  });
  assert.equal(privateSession.answer(correct(privateSession)).xp, 0);
});

test('Order and matching replays contain only their affected targets and preserve context', () => {
  const order = new OrderSession({ direction: 'send', targetLayers: [2, 5] });
  assert.deepEqual(order.targets, [5, 2]);
  assert.equal(order.answer(7), null);
  order.answer(5);
  order.answer(2);
  assert.equal(order.done, true);
  assert.equal(order.result.total, 2);
  const original = new MatchingSession();
  const id = original.cards[0].id;
  const matching = new MatchingSession({ taskIds: [id] });
  assert.equal(matching.cards.length, 1);
  assert.equal(
    matching.layerOrder.length,
    7,
    'Single-target replay still offers distractor layers',
  );
  matching.pair(id, matching.cards[0].layer);
  assert.equal(matching.result.total, 1);
  assert.equal(matching.done, true);
});

test('Packet replays ask only failed stages while filling previously correct construction in order', () => {
  const session = new PacketSession({ stageIds: ['port', 'next-hop'] });
  assert.deepEqual(
    session.missions.map((mission) => mission.id),
    ['port', 'next-hop'],
  );
  assert.deepEqual(session.placements, ['request']);
  session.select(session.current.correctId);
  session.place();
  assert.ok(session.placements.includes('address'));
  assert.ok(!session.placements.includes('signals'));
  session.next();
  session.select(session.current.correctId);
  session.place();
  assert.ok(session.placements.includes('signals'));
  session.next();
  assert.equal(session.result.total, 2);
  assert.equal(session.result.xp, 16);
  assert.equal(session.done, true);
});
