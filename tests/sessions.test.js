import test from 'node:test';
import assert from 'node:assert/strict';
import { QuizSession } from '../src/domain/quiz-session.js';
import { OrderSession } from '../src/domain/order-session.js';
import { FlashcardSession } from '../src/domain/flashcard-session.js';
import { questions } from '../src/data/questions/index.js';

const sample = questions.slice(0, 3);

test('A practice question cannot score twice; hints reduce independent accuracy and XP', () => {
  const session = new QuizSession(sample);
  assert.equal(session.next(), false);
  assert.equal(session.answer(-1), null);
  session.assisted = true;
  session.answer(session.current.correctIndex);
  assert.equal(session.answer(session.current.correctIndex), null);
  assert.equal(session.result.correct, 0);
  assert.equal(session.result.xp, 4);
  assert.equal(session.result.missedIds.length, 1);
  session.next();
  assert.equal(session.assisted, false);
  assert.equal(session.index, 1);
});

test('Exam answers are editable, flags persist, blanks are incorrect and submission is idempotent', () => {
  const session = new QuizSession(sample, { kind: 'exam' });
  session.answer(session.current.correctIndex);
  session.toggleFlag();
  session.jump(1);
  session.jump(0);
  assert.equal(session.flags.size, 1);
  session.answer(session.options[0].find((index) => index !== session.current.correctIndex));
  session.jump(2);
  session.next();
  assert.equal(session.reviewing, true);
  assert.equal(session.submit().length, 3);
  assert.equal(session.result.correct, 0);
  assert.equal(session.result.outcomes.filter((outcome) => outcome.selected === null).length, 2);
  assert.equal(session.submit().length, 0);
  assert.equal(session.answer(0), null);
});

test('Layer questions always offer the correct answer among four unique shuffled options', () => {
  const session = new QuizSession(questions.filter((question) => question.layerQuestion));
  session.questions.forEach((question, index) => {
    assert.equal(session.options[index].length, 4);
    assert.equal(new Set(session.options[index]).size, 4);
    assert.ok(session.options[index].includes(question.correctIndex));
  });
});

test('Order games support both directions and preserve error penalties for one step', () => {
  for (const direction of ['receive', 'send']) {
    const session = new OrderSession({ direction });
    assert.equal(session.expected, direction === 'send' ? 7 : 1);
    session.answer(direction === 'send' ? 1 : 7);
    const first = session.answer(session.expected);
    assert.equal(first.assisted, true);
    assert.equal(session.answer(first.layer), null);
    while (!session.done) session.answer(session.expected);
    assert.equal(session.result.correct, 6);
    assert.equal(session.result.xp, 52);
    assert.equal(session.answer(1), null);
  }
});

test('Flashcards can only be rated after being revealed', () => {
  const session = new FlashcardSession([{ id: 'one' }]);
  assert.equal(session.rate(), null);
  session.reveal();
  assert.equal(session.rate().id, 'one');
  assert.equal(session.done, true);
  assert.equal(session.rate(), null);
});
