import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../src/data/questions/index.js';
import { units } from '../src/data/units.js';
import { cases } from '../src/data/cases.js';
import { lessonContent } from '../src/features/study/content.js';

test('All questions have a unique key, valid answer and educational explanation', () => {
  assert.ok(questions.length >= 181, 'The expanded activity bank retains the original content');
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
  for (const question of questions) {
    assert.ok(question.layer >= 0 && question.layer <= 7, question.id);
    assert.ok(question.choices.length >= 3, question.id);
    assert.ok(question.choices[question.correctIndex], question.id);
    assert.ok(question.prompt && question.explanation && question.hint, question.id);
    assert.equal(new Set(question.choices).size, question.choices.length, question.id);
  }
});

test('Every guided case references three existing case questions', () => {
  for (const item of cases) {
    assert.equal(item.questionIds.length, 3);
    item.questionIds.forEach((id) =>
      assert.equal(questions.find((question) => question.id === id)?.type, 'case'),
    );
  }
});

test('All lessons have structured explanations and valid comprehension checks', () => {
  assert.ok(units.length >= 18);
  for (const unit of units) {
    const content = lessonContent(unit);
    assert.ok(content.introduction && content.takeaway);
    assert.ok(content.sections.length >= 3);
    assert.ok(content.check.choices[content.check.correctIndex]);
  }
});
