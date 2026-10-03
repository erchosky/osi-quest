import test from 'node:test';
import assert from 'node:assert/strict';
import { SpeedrunSession } from '../src/domain/speedrun-session.js';
import {
  examplePacket,
  inspectPacket,
  parseHex,
  hexText,
  checksum,
} from '../src/domain/packet-inspector.js';
import { createSession } from '../src/features/play/session-factory.js';
import { emptyProgress } from '../src/services/progress-schema.js';
import { sanitizeInterface } from '../src/services/interface-preferences.js';
import { dueCount } from '../src/domain/progress-metrics.js';
import { questions } from '../src/data/questions/index.js';
import { reviewEvidence } from '../src/domain/review-evidence.js';
import { pendingReviews } from '../src/domain/activity-preferences.js';
import { historicalAverage, buildRoundReport } from '../src/domain/round-report.js';
import { createProgressRepository } from '../src/services/progress-repository.js';
import { installWebMCP } from '../src/app/webmcp.js';
const q = {
  id: 'q',
  layer: 4,
  difficulty: 'normal',
  choices: ['Transporte', 'Red'],
  correctIndex: 0,
};
test('Legacy normal reviews survive normalization without becoming hard reviews', () => {
  const question = questions.find((q) => q.difficulty === 'normal' && q.type !== 'case');
  const stat = { due: 0, seen: 1, correct: 0, levels: {} };
  assert.equal(reviewEvidence(stat, 'normal'), stat);
  assert.equal(reviewEvidence(stat, 'hard'), undefined);
  assert.equal(pendingReviews({ stats: { [question.id]: stat } }, 'adaptive', 'normal', 100), 1);
  assert.equal(dueCount(questions, { [question.id]: stat }, 'hard', 100), 0);
});
test('Focused round comparison and serialized history retain the selected layer', () => {
  const s = createSession('focus', { layer: 4, seed: 'history' }, emptyProgress());
  const report = buildRoundReport(s, 1000, { rounds: 0, percent: null });
  assert.equal(report.focusLayer, 4);
  let saved;
  const storage = {
    getItem: () => saved,
    setItem: (_, value) => {
      saved = value;
    },
  };
  const repository = createProgressRepository(storage);
  repository.recordRound(report);
  assert.equal(createProgressRepository(storage).data.history.at(-1).focusLayer, 4);
  const history = [
    { mode: 'focus', difficulty: 'normal', focusLayer: 3, total: 10, correct: 0 },
    { mode: 'focus', difficulty: 'normal', focusLayer: 4, total: 10, correct: 10 },
  ];
  assert.deepEqual(
    historicalAverage(history, { kind: 'focus', difficulty: 'normal', focusLayer: 4 }),
    { rounds: 1, percent: 100 },
  );
});
test('Practice-only interactive rounds display no XP as well as avoiding persistent rewards', () => {
  for (const difficulty of ['normal', 'hard']) {
    const order = createSession('order', { difficulty, practiceOnly: true }, emptyProgress());
    for (const layer of order.targets) assert.equal(order.answer(layer).xp, 0);
    assert.equal(order.result.xp, 0);
    const matching = createSession('matching', { difficulty, practiceOnly: true }, emptyProgress());
    for (const task of matching.cards) assert.equal(matching.pair(task.id, task.layer).xp, 0);
    assert.equal(matching.result.xp, 0);
    const packet = createSession('packet', { difficulty, practiceOnly: true }, emptyProgress());
    while (!packet.done) {
      packet.select(packet.current.correctId);
      const outcome = packet.place();
      assert.equal(outcome.xp, 0);
      packet.next();
    }
    assert.equal(packet.result.xp, 0);
  }
});
test('Optional browser tools reject unexpected input and cannot abandon an open round', async () => {
  const registered = [];
  const context = { registerTool: (tool, options) => registered.push({ tool, options }) };
  const app = {
    repository: { data: emptyProgress() },
    hasOpenRound: () => true,
    router: {
      navigate: () => {
        throw new Error('must not navigate');
      },
    },
  };
  const cleanup = installWebMCP(app, context);
  assert.deepEqual(
    registered.map((r) => r.tool.name),
    ['read_learning_progress', 'configure_focused_practice'],
  );
  const read = registered[0].tool,
    configure = registered[1].tool;
  assert.equal(read.annotations.readOnlyHint, true);
  assert.deepEqual(read.execute({}), { xp: 0, lessonsCompleted: 0, rounds: 0 });
  assert.throws(() => read.execute({ alias: true }), /Parámetros/);
  await assert.rejects(configure.execute({ layer: 99 }), /entre 1 y 7/);
  await assert.rejects(configure.execute({ layer: 4 }), /Termina o pausa/);
  cleanup();
  assert.ok(registered.every((r) => r.options.signal.aborted));
});
test('Global sprint counts feedback time, caps chain bonuses, pauses cleanly and cannot award late XP', () => {
  let now = 0;
  const s = new SpeedrunSession(
    Array.from({ length: 10 }, (_, i) => ({ ...q, id: 'q' + i })),
    { now: () => now, random: () => 0.25 },
  );
  s.setActive(true);
  for (let i = 0; i < 5; i++) {
    now += 1000;
    const outcome = s.answer(0);
    assert.equal(outcome.timeBonusMs, i < 2 ? 2000 : i < 4 ? 3000 : 4000);
    s.next();
  }
  assert.equal(s.bestChain, 5);
  assert.equal(s.remainingMs, 69000);
  s.setActive(false);
  now += 100000;
  assert.equal(s.remainingMs, 69000);
  s.setActive(true);
  s.hint();
  assert.equal(s.answer(0).timeBonusMs, 0);
  assert.equal(s.chain, 0);
  s.next();
  now += 70000;
  assert.equal(s.answer(0), null);
  assert.equal(s.done, true);
  assert.equal(s.result.total, 6);
  assert.equal(s.finishReason, 'time');
});
test('Sprint can end with zero attempts and never duplicates a question reward', () => {
  let now = 0;
  const s = new SpeedrunSession([q], { now: () => now });
  s.setActive(true);
  now = 60001;
  assert.ok(s.tick());
  assert.equal(s.result.total, 0);
  assert.equal(s.result.xp, 0);
  assert.equal(s.next(), false);
});
test('Every focused layer has exclusively its own questions at both difficulties and retains seed', () => {
  for (const difficulty of ['normal', 'hard'])
    for (let layer = 1; layer <= 7; layer++) {
      const a = createSession('focus', { layer, difficulty, seed: 'same' }, emptyProgress()),
        b = createSession('focus', { layer, difficulty, seed: 'same' }, emptyProgress());
      assert.ok(a.questions.length >= 2);
      assert.ok(a.questions.every((q) => q.layer === layer));
      assert.deepEqual(a.questions, b.questions);
      assert.deepEqual(a.options, b.options);
    }
  assert.throws(() => createSession('focus', { layer: 99 }, emptyProgress()), /No hay preguntas/);
  const a = createSession('adaptive', { seed: 'same' }, emptyProgress()),
    b = createSession('adaptive', { seed: 'same' }, emptyProgress());
  assert.deepEqual(a.questions, b.questions);
});
test('Inspector decodes valid checksummed Ethernet IPv4 TCP HTTP with correct offsets', () => {
  const bytes = examplePacket(),
    r = inspectPacket(bytes);
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(
    r.segments.map((s) => [s.name, s.start, s.layer]),
    [
      ['Ethernet', 0, 2],
      ['IPv4', 14, 3],
      ['TCP', 34, 4],
      ['HTTP', 54, 7],
    ],
  );
  assert.equal(r.fields.find((f) => f.name === 'Puerto destino').value, '80');
  assert.equal(r.fields.find((f) => f.name === 'IP destino').value, '198.51.100.20');
  assert.match(r.fields.at(-1).value, /Host: example.com/);
  assert.deepEqual(parseHex(hexText(bytes)), bytes);
  assert.equal(checksum(bytes.slice(14, 34)), 0);
});
test('Inspector rejects malformed, oversized, fragmented and truncated frames without reading beyond bounds', () => {
  for (const input of ['a', 'zz', '', 'ff'.repeat(4097)]) assert.throws(() => parseHex(input));
  for (let n = 0; n < examplePacket().length; n++)
    assert.throws(() => inspectPacket(examplePacket().slice(0, n)));
  let bytes = examplePacket();
  bytes[20] |= 0x20;
  assert.throws(() => inspectPacket(bytes), /fragmentada/);
  bytes = examplePacket();
  bytes[46] = 0x10;
  assert.throws(() => inspectPacket(bytes), /TCP inválido/);
  bytes = examplePacket();
  bytes[24] ^= 1;
  assert.match(inspectPacket(bytes).warnings[0], /checksum/);
});
test('Themes are bounded and pending review counters isolate hard evidence from normal evidence', () => {
  assert.equal(sanitizeInterface({ theme: 'dark' }).theme, 'dark');
  assert.equal(sanitizeInterface({ theme: '<script>' }).theme, 'system');
  const n = questions.find((q) => q.difficulty === 'normal' && q.type !== 'case');
  const stats = { [n.id]: { due: 0, seen: 1, levels: { normal: { due: 0, seen: 1 } } } };
  assert.equal(dueCount(questions, stats, 'hard', 100), 0);
  assert.equal(dueCount(questions, stats, 'normal', 100), 1);
});
