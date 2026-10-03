import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../src/data/questions/index.js';
import {
  selectExam,
  selectByLayer,
  selectAdaptive,
  selectProtocols,
} from '../src/domain/question-selection.js';

test('Normal and difficult exams cover all seven layers without duplicates', () => {
  for (const difficulty of ['normal', 'hard']) {
    for (let run = 0; run < 20; run++) {
      const exam = selectExam(questions, difficulty);
      assert.equal(exam.length, 15);
      assert.equal(new Set(exam.map((question) => question.id)).size, 15);
      assert.equal(
        new Set(exam.filter((question) => question.layer > 0).map((question) => question.layer))
          .size,
        7,
      );
      assert.ok(exam.every((question) => question.type !== 'case'));
      if (difficulty === 'normal')
        assert.ok(exam.every((question) => question.difficulty === 'normal'));
      else assert.ok(exam.every((question) => question.difficulty === 'hard'));
    }
  }
});

test('Layer rounds include each layer and preserve the selected mode at both difficulties', () => {
  for (const type of ['function', 'scenario']) {
    const normal = selectByLayer(questions, type, 'normal');
    assert.equal(normal.length, 7);
    assert.equal(new Set(normal.map((question) => question.layer)).size, 7);
    assert.ok(
      normal.every((question) => question.type === type && question.difficulty === 'normal'),
    );
    assert.ok(
      selectByLayer(questions, type, 'hard').every(
        (question) => question.difficulty === 'hard' && question.type === type,
      ),
    );
  }
  assert.equal(selectProtocols(questions, 'normal').length, 8);
  assert.ok(
    selectProtocols(questions, 'hard').every(
      (question) => question.difficulty === 'hard' && question.type === 'protocol',
    ),
  );
});

test('Adaptive review prioritizes due questions, then unseen questions, then future reviews', () => {
  const normal = questions.filter(
    (question) => question.difficulty === 'normal' && question.type !== 'case',
  );
  const dueId = normal[0].id;
  const futureId = normal[1].id;
  const selected = selectAdaptive(
    questions,
    { [dueId]: { due: 100 }, [futureId]: { due: 500 } },
    'normal',
    200,
  );
  assert.equal(selected[0].id, dueId);
  assert.equal(selected.length, 10);
  assert.ok(!selected.some((question) => question.id === futureId));
  assert.equal(new Set(selected.map((question) => question.id)).size, 10);
});
