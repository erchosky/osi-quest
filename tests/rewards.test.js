import test from 'node:test';
import assert from 'node:assert/strict';
import { rewardXP, levelProgress, independentStreak } from '../src/domain/rewards.js';
import { QuizSession } from '../src/domain/quiz-session.js';
import { OrderSession } from '../src/domain/order-session.js';
import { createProgressRepository } from '../src/services/progress-repository.js';
import { questions } from '../src/data/questions/index.js';

test('Every difficulty rewards less with assistance and never rewards an incorrect answer', () => {
  assert.equal(rewardXP({ correct: true, difficulty: 'normal' }), 8);
  assert.equal(rewardXP({ correct: true, assisted: true, difficulty: 'normal' }), 4);
  assert.equal(rewardXP({ correct: true, difficulty: 'hard' }), 20);
  assert.equal(rewardXP({ correct: true, assisted: true, difficulty: 'hard' }), 10);
  for (const difficulty of ['normal', 'hard']) {
    assert.equal(rewardXP({ correct: false, difficulty }), 0);
  }
});

test('Practice, order and exam results agree with persisted rewards at both difficulties', () => {
  const bank = questions.slice(0, 3);
  for (const difficulty of ['normal', 'hard']) {
    for (const kind of ['function', 'exam']) {
      const repository = createProgressRepository(null);
      const session = new QuizSession(bank, { kind, difficulty });
      bank.forEach((question, index) => {
        session.jump(index);
        if (index === 0 && kind !== 'exam') session.assisted = true;
        const outcome = session.answer(question.correctIndex);
        if (kind !== 'exam') repository.recordAnswer(outcome, kind);
      });
      if (kind === 'exam')
        session.submit().forEach((outcome) => repository.recordAnswer(outcome, kind));
      assert.equal(repository.data.xp, session.result.xp, `${kind}/${difficulty}`);
      assert.equal(
        session.result.xp,
        kind === 'exam' ? (difficulty === 'hard' ? 60 : 24) : difficulty === 'hard' ? 50 : 20,
      );
    }
    const repository = createProgressRepository(null);
    const order = new OrderSession({ difficulty });
    order.answer(7);
    while (!order.done) repository.recordOrder(order.answer(order.expected));
    assert.equal(repository.data.xp, order.result.xp);
    assert.equal(order.result.xp, difficulty === 'hard' ? 130 : 52);
  }
});

test('Interactive rewards use difficulty and preserve achievements across backup migration', () => {
  const events = [];
  const repository = createProgressRepository(null, { onReward: (event) => events.push(event) });
  repository.restore({ version: 3, xp: 199, read: [], stats: {}, mastered: [] });
  repository.recordActivity(
    { layer: 3, correct: true, assisted: false, difficulty: 'hard', xp: 999 },
    'matching',
  );
  repository.recordActivity({ layer: 4, correct: false, difficulty: 'hard' }, 'packet');
  assert.equal(repository.data.xp, 219);
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { amount: 20, previousXP: 199, totalXP: 219, difficulty: 'hard' });
  const restored = createProgressRepository(null);
  restored.restore(JSON.parse(repository.export()));
  assert.ok(restored.data.mastered.includes('matching-3'));
});

test('Experience levels preserve all existing XP and cross exact boundaries', () => {
  assert.deepEqual(levelProgress(199), { level: 1, current: 199, target: 200, remaining: 1 });
  assert.deepEqual(levelProgress(200), { level: 2, current: 0, target: 200, remaining: 200 });
  assert.equal(levelProgress(420).level, 3);
  assert.equal(levelProgress(420).current, 20);
});

test('A hint or mistake breaks the independent streak, with later successes starting a new one', () => {
  assert.equal(independentStreak([{ correct: true }, { correct: true }]), 2);
  assert.equal(independentStreak([{ correct: true }, { correct: false }, { correct: true }]), 1);
  assert.equal(independentStreak([{ correct: true }, { correct: true, assisted: true }]), 0);
});
