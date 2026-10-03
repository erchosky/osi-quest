import test from 'node:test';
import assert from 'node:assert/strict';
import { units } from '../src/data/units.js';
import { practicalLessons } from '../src/data/practical-lessons.js';
import { lessonContent } from '../src/features/study/content.js';
import { activities } from '../src/data/activities.js';
import { misconceptions, misconceptionQuestions } from '../src/data/misconceptions.js';

const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;

test('The study route resolves all eighteen lessons with complete text and valid checks', () => {
  assert.equal(units.length, 18);
  assert.equal(new Set(units.map(({ id }) => id)).size, 18);
  for (const unit of units) {
    const content = lessonContent(unit);
    assert.ok(content, unit.id);
    assert.ok(nonempty(unit.title) && nonempty(unit.description), unit.id);
    assert.ok(nonempty(content.introduction) && nonempty(content.takeaway), unit.id);
    assert.ok(content.sections.length >= 3, unit.id);
    for (const section of content.sections) {
      assert.ok(nonempty(section.title), `${unit.id}: section title`);
      const prose = [...(section.paragraphs ?? []), ...(section.items ?? [])];
      assert.ok(prose.length > 0 && prose.every(nonempty), `${unit.id}: section prose`);
    }
    const check = content.check;
    assert.ok(nonempty(check.prompt) && nonempty(check.explanation), unit.id);
    assert.ok(check.choices.length >= 3 && check.choices.every(nonempty), unit.id);
    assert.equal(new Set(check.choices).size, check.choices.length, unit.id);
    assert.ok(
      Number.isInteger(check.correctIndex) &&
        check.correctIndex >= 0 &&
        check.correctIndex < check.choices.length,
      unit.id,
    );
  }
});

test('The six everyday lessons belong to the study route and preserve important distinctions', () => {
  const ids = ['url', 'wifi', 'home-network', 'speed', 'security', 'browser-errors'];
  assert.deepEqual(Object.keys(practicalLessons), ids);
  for (const id of ids) assert.ok(units.some((unit) => unit.id === id));
  const correct = (id) =>
    practicalLessons[id].check.choices[practicalLessons[id].check.correctIndex];
  assert.match(correct('url'), /respuesta HTTP/);
  assert.match(correct('wifi'), /barras no miden toda la conexión/);
  assert.match(correct('home-network'), /aplicación/);
  assert.equal(correct('speed'), '12,5 MB/s.');
  assert.match(correct('security'), /fiable sin confidencialidad/);
  assert.match(correct('browser-errors'), /comparar, sin cambiar toda la configuración/);
});

test('Confusion activity announces the real number of probes rather than a stale fixed total', () => {
  const activity = activities.find(({ id }) => id === 'confusions');
  assert.equal(
    activity.length,
    `${misconceptions.length} confusiones · ${misconceptionQuestions.length} comprobaciones`,
  );
  assert.equal(misconceptionQuestions.length, 24);
  assert.ok(misconceptions.every(({ questions }) => questions.length >= 4));
});
