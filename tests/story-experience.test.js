import test from 'node:test';
import assert from 'node:assert/strict';
import { storyChapters, storyQuestions } from '../src/data/story.js';
import { questions, learningQuestions, questionById } from '../src/data/questions/index.js';
import {
  chapterUnlocked,
  sanitizeStory,
  unlockedActivities,
  storyPassed,
} from '../src/domain/story-progress.js';
import { createSession } from '../src/features/play/session-factory.js';
import { createProgressRepository } from '../src/services/progress-repository.js';
import { emptyProgress, parseBackup } from '../src/services/progress-schema.js';
import { roundItems, outcomeStatus } from '../src/domain/round-progress.js';
import { roundProgress } from '../src/components/round-progress.js';
import { answerLayer } from '../src/components/answer-layer.js';
import { recordConcept } from '../src/domain/concept-badges.js';
import { misconceptions } from '../src/data/misconceptions.js';
import { ActivityClock } from '../src/domain/activity-clock.js';
import { buildRoundReport, historicalAverage, formatDuration } from '../src/domain/round-report.js';
const outcome = (session, right = true) =>
  session.answer(
    right
      ? session.current.correctIndex
      : (session.type === 'duel' ? session.options : session.options[session.index]).find(
          (index) => index !== session.current.correctIndex,
        ),
  );
const finish = (session) => {
  while (!session.done) {
    outcome(session);
    session.next();
  }
  return session.result;
};

test('Seven home chapters cover all seven layers and all thirteen unlockable activities', () => {
  assert.equal(storyChapters.length, 7);
  assert.equal(storyQuestions.length, 21);
  assert.equal(learningQuestions.length, 226);
  assert.equal(new Set(storyQuestions.map((q) => q.id)).size, 21);
  assert.deepEqual(
    [...new Set(storyQuestions.filter((q) => q.layer).map((q) => q.layer))].sort(),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(unlockedActivities(storyChapters.map((ch) => ch.id)).length, 13);
  assert.equal(questions.length, 181, 'Expanded bank uses the new classroom revision');
  for (const q of storyQuestions) {
    assert.equal(questionById.get(q.id), q);
    assert.equal(q.choices.length, 4);
    assert.ok(q.explanation.length > 50 && q.hint.length > 15);
  }
});
test('Story unlocks enforce previous chapters and reject jumped or unknown import progress', () => {
  assert.ok(chapterUnlocked([], 'cable'));
  assert.equal(chapterUnlocked([], 'wifi'), false);
  assert.equal(chapterUnlocked([], 'unknown'), false);
  assert.deepEqual(sanitizeStory({ completed: ['ready', 'dns'] }), { completed: [] });
  assert.deepEqual(sanitizeStory({ completed: ['wifi', 'cable', 'ready'] }), {
    completed: ['cable', 'wifi'],
  });
  assert.deepEqual(unlockedActivities(['cable']), ['order', 'function']);
});
test('Factory blocks locked chapters and preserves normal guided story context', () => {
  assert.throws(
    () => createSession('story', { chapterId: 'dns' }, emptyProgress()),
    /capítulo anterior/,
  );
  const session = createSession(
    'story',
    { chapterId: 'cable', difficulty: 'normal' },
    emptyProgress(),
  );
  assert.equal(session.storyChapter.id, 'cable');
  assert.equal(session.questions.length, 3);
  assert.equal(session.type, 'quiz');
});
test('Completing a chapter requires three answers and two correct decisions, assisted decisions can build', () => {
  assert.equal(storyPassed({ outcomes: [{ correct: true }, { correct: true }] }), false);
  assert.equal(
    storyPassed({ outcomes: [{ correct: true }, { correct: false }, { correct: false }] }),
    false,
  );
  assert.equal(
    storyPassed({
      outcomes: [{ correct: true, assisted: true }, { correct: false }, { correct: true }],
    }),
    true,
  );
});
test('Story completion is ordered, idempotent, persistent and does not award extra completion XP', () => {
  const repository = createProgressRepository(null),
    session = createSession('story', { chapterId: 'cable' }, repository.data);
  assert.equal(repository.completeChapter('wifi', finish(session)), false);
  assert.ok(repository.completeChapter('cable', session.result));
  assert.ok(repository.completeChapter('cable', session.result));
  assert.deepEqual(repository.data.story.completed, ['cable']);
  assert.equal(repository.data.xp, 0);
  const backup = parseBackup(repository.export());
  assert.deepEqual(backup.story.completed, ['cable']);
});
test('Progress dots distinguish independent answers, errors, help and untouched steps', () => {
  const session = createSession('function', { difficulty: 'normal' }, emptyProgress());
  assert.equal(roundItems(session)[0].status, 'pending');
  outcome(session, false);
  session.next();
  session.hint();
  outcome(session);
  session.next();
  outcome(session);
  assert.deepEqual(
    roundItems(session)
      .slice(0, 4)
      .map((item) => item.status),
    ['wrong', 'assisted', 'correct', 'pending'],
  );
  const html = roundProgress(session);
  assert.match(html, /dot-wrong/);
  assert.match(html, /dot-assisted/);
  assert.match(html, /aria-current="step"/);
});
test('Exam progress never exposes correctness before handing in', () => {
  const session = createSession('exam', { difficulty: 'normal' }, emptyProgress());
  outcome(session, false);
  assert.equal(roundItems(session)[0].status, 'answered');
  assert.doesNotMatch(roundProgress(session), /dot-wrong|dot-correct/);
  session.submit();
  assert.equal(roundItems(session)[0].status, 'wrong');
});
test('Duel dots never expose the first player answer in handoff or before the second answers', () => {
  const session = createSession('duel', { difficulty: 'normal' }, emptyProgress());
  session.beginTurn();
  outcome(session);
  assert.equal(roundItems(session, 0)[0].status, 'pending');
  session.beginTurn();
  outcome(session, false);
  assert.equal(roundItems(session, 0)[0].status, 'correct');
  assert.equal(roundItems(session, 1)[0].status, 'wrong');
});
test('Layer feedback supplies colored exact-layer tag and highlights only that layer', () => {
  const html = answerLayer(4);
  assert.match(html, /Capa 4 · Transporte/);
  assert.match(html, /class="mini-layer is-active" data-mini-layer="4"/);
  assert.equal((html.match(/is-active/g) || []).length, 1);
  assert.match(answerLayer(0), /Fundamentos/);
});
test('Immediate recovery gives half XP but cannot alter stats, scheduled retrieval, badges or mastery', () => {
  const repository = createProgressRepository(null);
  const q = misconceptions[0].questions[0];
  repository.recordAnswer(
    { question: q, correct: false, assisted: false, difficulty: 'hard' },
    'function',
  );
  const stats = JSON.stringify(repository.data.stats),
    badges = JSON.stringify(repository.data.concepts);
  const session = createSession(
    'retry',
    { difficulty: 'hard', recovery: true, questionIds: [q.id] },
    repository.data,
  );
  const corrected = outcome(session);
  repository.recordAnswer(corrected, 'retry');
  session.next();
  assert.equal(corrected.xp, 10);
  assert.equal(session.result.xp, 10);
  assert.equal(repository.data.xp, 10);
  assert.equal(JSON.stringify(repository.data.stats), stats);
  assert.equal(JSON.stringify(repository.data.concepts), badges);
  assert.equal(repository.data.mastered.length, 0);
  assert.equal(outcomeStatus(corrected), 'assisted');
});
test('Repeating the same immediate recovery inside ten minutes cannot award XP twice', () => {
  const repository = createProgressRepository(null),
    id = storyQuestions[0].id;
  for (let i = 0; i < 2; i++) {
    const session = createSession(
      'retry',
      { difficulty: 'normal', questionIds: [id], recovery: true },
      repository.data,
    );
    const corrected = outcome(session);
    repository.recordAnswer(corrected, 'retry');
    session.next();
    assert.equal(corrected.xp, i === 0 ? 4 : 0);
    assert.equal(session.result.xp, corrected.xp);
  }
  assert.equal(repository.data.xp, 4);
  const backup = parseBackup(repository.export());
  assert.ok(backup.recoveryRewards[id] > Date.now());
});
test('Single-task matching recovery keeps seven distractor layer choices', () => {
  const original = createSession('matching', { difficulty: 'hard' }, emptyProgress()),
    id = original.cards[0].id;
  const session = createSession(
    'matching',
    { difficulty: 'hard', recovery: true, taskIds: [id] },
    emptyProgress(),
  );
  assert.equal(session.cards.length, 1);
  assert.equal(session.layerOrder.length, 7);
  const o = session.pair(id, session.cards[0].layer);
  assert.equal(o.xp, 10);
  assert.equal(o.recovery, true);
});
test('Single-layer order recovery permits all seven choices and does not call context choices correct', () => {
  const session = createSession(
    'order',
    { difficulty: 'hard', direction: 'send', targetLayers: [7], recovery: true },
    emptyProgress(),
  );
  assert.equal(session.answer(6).correct, false);
  assert.equal(session.done, false);
  const corrected = session.answer(7);
  assert.equal(corrected.xp, 10);
  assert.equal(corrected.recovery, true);
});
test('Case retries preserve the investigation description and original question IDs', () => {
  const session = createSession(
    'retry',
    { difficulty: 'normal', questionIds: ['cable-1'], caseId: 'cable', recovery: true },
    emptyProgress(),
  );
  assert.equal(session.caseStudy.id, 'cable');
  assert.ok(session.caseStudy.description.length > 20);
  assert.equal(session.current.id, 'cable-1');
});
test('Error or hint blocks immediate badge proofs; delayed two-question proof can earn it', () => {
  const [a, b] = misconceptions[0].questions;
  let state = recordConcept(undefined, { question: a, correct: false }, 1000);
  state = recordConcept(state, { question: a, correct: true }, 2000);
  state = recordConcept(state, { question: b, correct: true }, 3000);
  assert.equal(state.earnedAt, null);
  assert.deepEqual(state.proofIds, []);
  state = recordConcept(state, { question: a, correct: true }, 601001);
  state = recordConcept(state, { question: b, correct: true }, 602000);
  assert.equal(state.earnedAt, 602000);
});
test('Exam submission batches storage and reward effects once while preserving all scores', () => {
  let writes = 0,
    rewards = 0;
  const storage = {
      getItem() {
        return null;
      },
      setItem() {
        writes++;
      },
    },
    repository = createProgressRepository(storage, {
      onReward() {
        rewards++;
      },
    });
  const session = createSession('exam', { difficulty: 'normal' }, repository.data);
  for (let i = 0; i < 15; i++) {
    outcome(session);
    session.next();
  }
  repository.recordAnswers(session.submit(), 'exam');
  assert.equal(writes, 1);
  assert.equal(rewards, 1);
  assert.equal(repository.data.xp, 120);
  assert.equal(Object.keys(repository.data.stats).length, 15);
});
test('Short elapsed durations are readable without empty minute counters', () => {
  assert.equal(formatDuration(400), 'Menos de 1 s');
  assert.equal(formatDuration(42000), '42 s');
  assert.equal(formatDuration(122000), '2 min 02 s');
  assert.equal(formatDuration(null), 'Sin tiempo registrado');
});

test('Real incorrect interactive attempts remain separate from explicitly requested hints', () => {
  const repository = createProgressRepository(null);
  const order = createSession('order', { difficulty: 'hard', direction: 'send' }, repository.data);
  order.answer(1);
  order.answer(2);
  order.answer(7);
  assert.equal(order.outcomes[0].errors, 2);
  assert.equal(order.outcomes[0].hintUsed, false);
  const report = buildRoundReport(order, 1500, null);
  assert.deepEqual(report.failures[0], {
    layer: 7,
    wrong: 2,
    assisted: 0,
    unanswered: 0,
    timedOut: 0,
  });
  const packet = createSession('packet', { difficulty: 'normal' }, repository.data);
  packet.select(packet.choices.find((c) => c.id !== packet.current.correctId).id);
  packet.place();
  packet.hint();
  packet.select(packet.current.correctId);
  packet.place();
  const group = buildRoundReport(packet, 1000, null).failures[0];
  assert.equal(group.wrong, 1);
  assert.equal(group.assisted, 1);
});
test('Non-finite or backwards clock readings cannot corrupt a report duration', () => {
  let time = 100;
  const clock = new ActivityClock(() => time);
  clock.setActive(true);
  time = 200;
  assert.equal(clock.elapsedMs, 100);
  time = NaN;
  assert.equal(clock.elapsedMs, 100);
  time = 50;
  assert.equal(clock.elapsedMs, 100);
  time = 300;
  assert.equal(clock.stop(), 200);
  const session = createSession('function', { difficulty: 'normal' }, emptyProgress());
  assert.equal(buildRoundReport(session, NaN, null).durationMs, null);
});
test('Averages keep individual classroom codes and story chapters separate', () => {
  const history = [
    { mode: 'function', difficulty: 'normal', total: 5, correct: 5, challengeCode: 'A' },
    { mode: 'function', difficulty: 'normal', total: 5, correct: 0, challengeCode: 'B' },
  ];
  assert.deepEqual(
    historicalAverage(history, { kind: 'function', difficulty: 'normal', challengeCode: 'A' }),
    { rounds: 1, percent: 100 },
  );
});
