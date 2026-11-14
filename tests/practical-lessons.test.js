import test from 'node:test';
import assert from 'node:assert/strict';
import { units } from '../src/data/units.js';
import { practicalLessons } from '../src/data/practical-lessons.js';
import { lessonContent } from '../src/features/study/content.js';
import { activities } from '../src/data/activities.js';
import { misconceptions, misconceptionQuestions } from '../src/data/misconceptions.js';
import { lessonChecks } from '../src/data/lesson-checks.js';
import { checkFeedback } from '../src/features/study/lesson-view.js';
import { layers } from '../src/data/layers.js';
import { matchingTasks } from '../src/data/matching.js';
import { storyChapters } from '../src/data/story.js';
import { layerLessons } from '../src/data/layer-lessons/index.js';
import { learningQuestions } from '../src/data/questions/index.js';
import { cachedLesson, loadLessonContent } from '../src/features/study/lesson-loader.js';

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
  assert.match(correct('url'), /participante HTTP/);
  assert.match(correct('wifi'), /misma descarga por cable/);
  assert.match(correct('home-network'), /configuración; IP direcciona/);
  assert.match(correct('speed'), /12 MB\/s son 96 Mb\/s/);
  assert.match(correct('security'), /fiable y ordenada, sin cifrado/);
  assert.match(correct('browser-errors'), /Comparar recursos y disponibilidad/);
});

test('Every foundation and practical check applies a situation with four individually explained choices', () => {
  const lessons = units.filter((unit) => !unit.layer);
  assert.equal(lessons.length, 11);
  assert.deepEqual(new Set(Object.keys(lessonChecks)), new Set(lessons.map(({ id }) => id)));
  for (const unit of lessons) {
    const check = lessonContent(unit).check;
    assert.equal(check.choices.length, 4, unit.id);
    assert.equal(check.reasons.length, check.choices.length, unit.id);
    assert.ok(check.reasons.every(nonempty), unit.id);
    for (let selected = 0; selected < check.choices.length; selected++) {
      const feedback = checkFeedback(check, selected);
      assert.ok(feedback.includes(check.explanation), unit.id);
      if (selected !== check.correctIndex) {
        assert.ok(feedback.includes(check.reasons[selected]), `${unit.id}:${selected}`);
        assert.match(feedback, /Por qué tu elección no encaja/);
      } else {
        assert.doesNotMatch(feedback, /Por qué tu elección no encaja/);
      }
    }
  }
});

test('Choice-specific study feedback escapes authored content and supports existing layer checks', () => {
  const check = { correctIndex: 0, explanation: 'A & B', reasons: ['Correcta', '<img src=x>'] };
  const wrong = checkFeedback(check, 1);
  assert.match(wrong, /&lt;img src=x&gt;/);
  assert.doesNotMatch(wrong, /<img/);
  assert.match(wrong, /A &amp; B/);
  const layerCheck = lessonContent(units.find(({ id }) => id === 'layer-4')).check;
  assert.ok(checkFeedback(layerCheck, 0).includes(layerCheck.explanation));
});

test('Seven authored layer lessons have substantial distinct content and original study checks', () => {
  const gamePrompts = new Set(
    [...learningQuestions, ...matchingTasks].map(({ prompt }) => prompt.trim().toLowerCase()),
  );
  const studyPrompts = new Set();
  for (const unit of units.filter(({ layer }) => layer)) {
    const content = lessonContent(unit);
    assert.equal(content, layerLessons[unit.layer]);
    assert.ok(content.sections.length >= 6, unit.id);
    const prose = [
      content.introduction,
      ...content.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.items ?? [])]),
    ].join(' ');
    assert.ok(prose.split(/\s+/).length >= 500, `${unit.id}: substantive lesson`);
    assert.equal(unit.minutes, Math.ceil(prose.split(/\s+/).length / 200), unit.id);
    assert.ok(nonempty(content.teachBack), unit.id);
    assert.equal(content.check.choices.length, 4, unit.id);
    assert.equal(content.check.reasons.length, 4, unit.id);
    assert.ok(content.check.reasons.every(nonempty), unit.id);
    const prompt = content.check.prompt.trim().toLowerCase();
    assert.ok(!gamePrompts.has(prompt), `${unit.id}: repeated game prompt`);
    assert.notEqual(content.check.prompt, layers[unit.layer - 1].scenario);
    assert.ok(!studyPrompts.has(prompt), `${unit.id}: repeated study prompt`);
    studyPrompts.add(prompt);
  }
  assert.equal(studyPrompts.size, 7);
});

test('Deferred lesson loading shares pending work and resolves the same complete authored content', async () => {
  const transport = units.find(({ id }) => id === 'layer-4');
  assert.equal(cachedLesson(transport), undefined);
  const first = loadLessonContent(transport);
  const second = loadLessonContent(transport);
  assert.equal(first, second);
  const content = await first;
  assert.equal(content, lessonContent(transport));
  assert.equal(cachedLesson(transport), content);
  for (const unit of units) assert.equal(await loadLessonContent(unit), lessonContent(unit));
  await assert.rejects(loadLessonContent({ id: 'missing', layer: 99 }), /no disponible/);
});

test('Link analogies refer to the next local leg, while transport identifies the final process', () => {
  const link = layers.find(({ number }) => number === 2);
  const transport = layers.find(({ number }) => number === 4);
  assert.match(link.analogy, /tramo/);
  assert.match(transport.analogy, /departamento/);
  const local = matchingTasks.find(({ id }) => id === 'normal-link-mac');
  assert.match(local.explanation, /siguiente salto/);
  assert.doesNotMatch(local.explanation, /buzón concreto dentro/);
  const wifi = storyChapters.find(({ id }) => id === 'wifi');
  assert.match(wifi.analogy, /tramo local recuerda a Enlace/);
  assert.match(wifi.analogy, /puertos de Transporte/);
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
