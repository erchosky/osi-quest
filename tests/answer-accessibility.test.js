import test from 'node:test';
import assert from 'node:assert/strict';
import { answerChoices } from '../src/components/answer-choices.js';
import { alternativeReasons, answerFeedback } from '../src/components/answer-feedback.js';
const question = {
  id: 'accessible-sample',
  layer: 4,
  correctIndex: 0,
  choices: ['Entrega entre procesos', 'Cifrado <TLS>', 'Nombres de dominio', 'Voltaje'],
  whyChoices: [
    'Es la función pedida.',
    'El cifrado no lo realiza TCP.',
    'Resolver nombres es otra acción.',
    'El voltaje transporta señales.',
  ],
  explanation: 'Transporte distingue los procesos mediante puertos.',
};
test('Revealed answers expose correct and incorrect states without removing keyboard access', () => {
  const output = answerChoices(question, [1, 0, 2, 3], {
    answer: { selected: 1, correct: false },
    reveal: true,
  });
  assert.equal((output.match(/aria-disabled="true"/g) ?? []).length, 4);
  assert.equal((output.match(/\sdisabled(?:\s|>)/g) ?? []).length, 0);
  assert.match(output, /✗<\/span><span>Tu respuesta/);
  assert.match(output, /✓<\/span><span>Correcta/);
});
test('Editable exam alternatives preserve selection without exposing correct answers', () => {
  const output = answerChoices(question, [1, 0, 2, 3], {
    answer: { selected: 1, correct: false },
    editable: true,
  });
  assert.equal((output.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.doesNotMatch(output, /is-correct|is-wrong|aria-disabled/);
});
test('Unrevealed duel alternatives never include a correct answer state or reasons', () => {
  const output = answerChoices(question, [1, 0, 2, 3]);
  assert.doesNotMatch(output, /is-correct|is-wrong|El cifrado|Es la función pedida/);
  assert.match(output, /Cifrado &lt;TLS&gt;/);
});
test('Alternative reasons stay aligned with distractors and escape content', () => {
  const output = alternativeReasons(question);
  assert.match(output, /Por qué no las otras/);
  assert.equal((output.match(/<li>/g) ?? []).length, 3);
  assert.match(output, /Cifrado &lt;TLS&gt;/);
  assert.doesNotMatch(output, /Es la función pedida/);
  assert.equal(alternativeReasons({ ...question, whyChoices: ['Incomplete'] }), '');
});
test('Scannable feedback explicitly identifies the error, correct response and layer', () => {
  const output = answerFeedback(question, { selected: 1, correct: false, xp: 0 });
  assert.match(output, /✗ Respuesta incorrecta/);
  assert.match(output, /Respuesta correcta/);
  assert.match(output, /Entrega entre procesos/);
  assert.match(output, /Capa 4/);
  assert.match(output, /id="question-feedback"/);
});
test('Layer questions explain only alternatives actually shown in the round', () => {
  const output = alternativeReasons(
    {
      choices: [
        'Física',
        'Enlace de datos',
        'Red',
        'Transporte',
        'Sesión',
        'Presentación',
        'Aplicación',
      ],
      correctIndex: 0,
      layerQuestion: true,
    },
    [0, 2, 3, 6],
  );
  assert.equal((output.match(/<li>/g) ?? []).length, 3);
  assert.match(output, /Direccionar y encaminar/);
  assert.doesNotMatch(output, /<strong>Sesión/);
  assert.doesNotMatch(output, /<strong>Presentación/);
});
