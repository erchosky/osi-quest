import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, learningQuestions, questionById } from '../src/data/questions/index.js';
import { normalQuestions } from '../src/data/questions/normal.js';
import { difficultQuestions } from '../src/data/questions/difficult.js';
import { caseQuestions } from '../src/data/questions/cases.js';
import { hardFunctionQuestions } from '../src/data/questions/hard-functions.js';
import { hardScenarioQuestions } from '../src/data/questions/hard-scenarios.js';
import { hardProtocolQuestions } from '../src/data/questions/hard-protocols.js';
import { normalFunctionQuestions } from '../src/data/questions/normal-functions.js';
import { misconceptions } from '../src/data/misconceptions.js';
import {
  selectByLayer,
  selectProtocols,
  selectAdaptive,
} from '../src/domain/question-selection.js';
import { seededRandom } from '../src/domain/random.js';
import { layerMastery } from '../src/domain/mastery.js';
import { QuizSession } from '../src/domain/quiz-session.js';

const newQuestions = [
  ...hardFunctionQuestions,
  ...hardScenarioQuestions,
  ...hardProtocolQuestions,
  ...normalFunctionQuestions,
];

test('The expanded bank preserves every original ID and indexes all learning content uniquely', () => {
  for (const original of [...normalQuestions, ...difficultQuestions, ...caseQuestions]) {
    assert.equal(questionById.get(original.id), original, original.id);
  }
  assert.equal(questionById.size, learningQuestions.length);
  assert.equal(new Set(questions.map(({ id }) => id)).size, questions.length);
});

test('Every layer has at least three hard function, situation and protocol questions', () => {
  for (let layer = 1; layer <= 7; layer++) {
    for (const type of ['function', 'scenario', 'protocol']) {
      const pool = questions.filter(
        (question) =>
          question.layer === layer && question.type === type && question.difficulty === 'hard',
      );
      assert.ok(pool.length >= 3, `${layer} ${type}`);
      assert.equal(new Set(pool.map(({ prompt }) => prompt)).size, pool.length);
    }
    assert.ok(
      questions.filter(
        (question) =>
          question.layer === layer &&
          question.type === 'function' &&
          question.difficulty === 'normal',
      ).length >= 4,
    );
  }
});

test('New questions explain each distinct choice and cite primary technical sources', () => {
  for (const question of newQuestions) {
    assert.equal(question.choices.length, 4, question.id);
    assert.equal(new Set(question.choices).size, 4, question.id);
    assert.equal(question.whyChoices.length, question.choices.length, question.id);
    assert.ok(
      question.whyChoices.every((why) => typeof why === 'string' && why.length >= 20),
      question.id,
    );
    assert.equal(new Set(question.whyChoices).size, 4, question.id);
    assert.ok(question.sources.length > 0, question.id);
    assert.ok(
      question.sources.every((source) =>
        /^https:\/\/www\.(itu\.int|ieee802\.org|rfc-editor\.org)\//.test(source),
      ),
      question.id,
    );
  }
});

test('Mode-specific rounds keep their identity and vary across seeded classroom rounds', () => {
  for (const type of ['function', 'scenario']) {
    const seen = Array.from({ length: 7 }, () => new Set());
    for (let run = 0; run < 80; run++) {
      const selected = selectByLayer(
        questions,
        type,
        'hard',
        seededRandom(`content-${type}-${run}`),
      );
      assert.equal(selected.length, 7);
      assert.equal(new Set(selected.map(({ layer }) => layer)).size, 7);
      assert.ok(
        selected.every((question) => question.type === type && question.difficulty === 'hard'),
      );
      selected.forEach(({ layer, id }) => seen[layer - 1].add(id));
    }
    seen.forEach((ids, index) => assert.ok(ids.size >= 3, `${type} layer ${index + 1}`));
  }
});

test('Difficult protocol rounds contain protocols for every layer without duplicate questions', () => {
  for (let run = 0; run < 30; run++) {
    const selected = selectProtocols(questions, 'hard', seededRandom(`protocol-${run}`));
    assert.equal(selected.length, 8);
    assert.equal(new Set(selected.map(({ id }) => id)).size, 8);
    assert.equal(new Set(selected.map(({ layer }) => layer)).size, 7);
    assert.ok(
      selected.every((question) => question.type === 'protocol' && question.difficulty === 'hard'),
    );
  }
});

test('Difficult physical content supplies enough distinct evidence for a complete radar', () => {
  const pool = learningQuestions.filter(
    (question) => question.layer === 1 && question.difficulty === 'hard',
  );
  assert.ok(pool.length >= 4);
  const stats = Object.fromEntries(
    pool.slice(0, 4).map(({ id }) => [id, { levels: { hard: { seen: 1, correct: 1 } } }]),
  );
  assert.equal(layerMastery(learningQuestions, stats, 1, 'hard').score, 100);
  assert.equal(layerMastery(learningQuestions, stats, 1, 'hard').limited, false);
});

test('Adaptive review chooses due evidence from the selected level before unseen content', () => {
  const bank = normalFunctionQuestions.slice(0, 3);
  const [a, b, c] = bank;
  const stats = {
    [a.id]: { due: 900, levels: { hard: { due: 10 }, normal: { due: 900 } } },
    [b.id]: { due: 10, levels: { hard: { due: 900 }, normal: { due: 10 } } },
  };
  assert.deepEqual(
    selectAdaptive(bank, stats, 'hard', 100, seededRandom('adaptive')).map(({ id }) => id),
    [a.id, c.id, b.id],
  );
  assert.deepEqual(
    selectAdaptive(bank, stats, 'normal', 100, seededRandom('adaptive')).map(({ id }) => id),
    [b.id, c.id, a.id],
  );
});

test('Each misconception has four varied probes while retaining original proofs', () => {
  for (const concept of misconceptions) {
    assert.ok(concept.questions.length >= 4, concept.id);
    assert.equal(
      new Set(concept.questions.map(({ prompt }) => prompt)).size,
      concept.questions.length,
    );
    assert.ok(
      concept.questions
        .slice(2)
        .every((question) => question.whyChoices.length === question.choices.length),
    );
    assert.ok(
      concept.questions.slice(0, 2).every(({ id }) => /-[12]$/.test(id)),
      concept.id,
    );
  }
});

test('Feedback explanations stay aligned when the session shuffles answer indices', () => {
  const question = hardScenarioQuestions[0];
  const session = new QuizSession([question], {
    difficulty: 'hard',
    random: seededRandom('feedback'),
  });
  for (const index of session.options[0]) {
    assert.ok(question.choices[index] && question.whyChoices[index]);
  }
  const outcome = session.answer(question.correctIndex);
  assert.equal(outcome.correct, true);
  assert.equal(outcome.question.whyChoices[outcome.selected], question.whyChoices[0]);
});

test('Upper-layer protocol examples state the limits of mapping real protocols to OSI', () => {
  const session = questionById.get('hard-protocol-5-1');
  const presentation = questionById.get('hard-protocol-6-1');
  const tls = questionById.get('hard-protocol-6-3');
  const quic = questionById.get('hard-protocol-4-3');
  assert.match(session.explanation, /no necesitas memorizar/);
  assert.match(presentation.explanation, /sin utilizar X.226/);
  assert.match(tls.choices[tls.correctIndex], /no encaja en una sola capa/);
  assert.match(quic.choices[quic.correctIndex], /usando UDP/);
  assert.match(questionById.get('hard-scenario-2-3').explanation, /TTL o Hop Limit pueden cambiar/);
});
