import test from 'node:test';
import assert from 'node:assert/strict';
import {
  questions,
  flashcards,
  misconceptions,
  storyChapters,
} from '../src/data/progress-catalog.js';
import { questions as source } from '../src/data/questions/index.js';
import { flashcards as cards } from '../src/data/flashcards.js';
import { storyChapters as story } from '../src/data/story.js';
import { misconceptions as concepts } from '../src/data/misconceptions.js';
test('Lightweight progress catalog matches authored banks without leaking answer content', () => {
  assert.deepEqual(
    questions,
    source.map(({ id, layer, type, difficulty }) => ({ id, layer, type, difficulty })),
  );
  assert.deepEqual(
    flashcards.map((x) => x.id),
    cards.map((x) => x.id),
  );
  assert.deepEqual(
    storyChapters.map((c) => c.questions.map((q) => q.id)),
    story.map((c) => c.questions.map((q) => q.id)),
  );
  assert.deepEqual(
    misconceptions.map((c) => c.questions.map((q) => q.id)),
    concepts.map((c) => c.questions.map((q) => q.id)),
  );
  assert.ok(questions.every((q) => !('choices' in q) && !('correctIndex' in q)));
});
