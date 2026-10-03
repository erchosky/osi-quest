import test from 'node:test';
import assert from 'node:assert/strict';
import { PacketSession } from '../src/domain/packet-session.js';
import { packetMissions } from '../src/data/packet-missions.js';

function build(session) {
  while (!session.done) {
    session.select(session.current.correctId);
    session.place();
    session.next();
  }
}

test('packet assembly follows the functions from HTTP down to wired signals', () => {
  const session = new PacketSession({ random: () => 0.5 });
  assert.equal(session.type, 'packet');
  assert.equal(session.next(), false);
  assert.equal(session.place(), null);
  build(session);
  assert.deepEqual(session.placements, [
    'request',
    'port',
    'reliability',
    'address',
    'next-hop',
    'signals',
  ]);
  assert.equal(session.result.total, 6);
  assert.equal(session.result.correct, 6);
  assert.equal(session.result.xp, 48);
  assert.deepEqual(
    session.outcomes.map((outcome) => outcome.layer),
    [7, 4, 4, 3, 2, 1],
  );
});

test('hard assembly adds explicit traps and earns more XP for independent success', () => {
  const normal = new PacketSession();
  const hard = new PacketSession({ difficulty: 'hard' });
  assert.ok(normal.choices.every((choice) => !choice.hardOnly));
  assert.ok(hard.choices.some((choice) => choice.hardOnly));
  build(hard);
  assert.equal(hard.result.xp, 120);
  assert.ok(
    hard.result.outcomes.every((outcome) => outcome.difficulty === 'hard' && outcome.xp === 20),
  );
});

test('a wrong piece explains its error, stays on its stage and reduces the eventual reward', () => {
  const session = new PacketSession({ difficulty: 'hard' });
  const wrong = session.choices.find((choice) => choice.id !== session.current.correctId);
  session.select(wrong.id);
  const failure = session.place();
  assert.equal(failure.correct, false);
  assert.equal(failure.xp, 0);
  assert.equal(session.feedback.text, wrong.why);
  assert.equal(session.index, 0);
  assert.equal(session.outcomes.length, 0);
  session.select(session.current.correctId);
  const success = session.place();
  assert.equal(success.assisted, true);
  assert.equal(success.xp, 10);
  assert.equal(session.place(), null);
  assert.equal(session.outcomes.length, 1);
  session.next();
  assert.equal(session.hadError, false);
  assert.equal(session.assisted, false);
});

test('a hint marks only its own stage as assisted and cannot be requested twice', () => {
  const session = new PacketSession();
  assert.equal(session.hint(), true);
  assert.equal(session.hint(), false);
  session.select(session.current.correctId);
  assert.equal(session.place().xp, 4);
  assert.equal(session.hint(), false);
  session.next();
  assert.equal(session.assisted, false);
  session.select(session.current.correctId);
  assert.equal(session.place().xp, 8);
});

test('unknown pieces, past-stage pieces and repeated completion cannot earn rewards', () => {
  const session = new PacketSession({ difficulty: 'anything' });
  assert.equal(session.difficulty, 'normal');
  assert.equal(session.select('not-a-piece'), false);
  session.select('http');
  session.place();
  assert.equal(session.select('http'), false);
  session.next();
  assert.equal(session.select('http'), false);
  build(session);
  const xp = session.result.xp;
  assert.equal(session.next(), false);
  assert.equal(session.place(), null);
  assert.equal(session.select(session.current.correctId), false);
  assert.equal(session.result.xp, xp);
  assert.equal(session.outcomes.length, 6);
});

test('all choices have a specific explanation and every mission has a supported correct piece', () => {
  for (const mission of packetMissions) {
    assert.ok(mission.choices.some((choice) => choice.id === mission.correctId));
    assert.ok(mission.support && mission.hint && mission.explanation);
    for (const choice of mission.choices.filter((choice) => choice.id !== mission.correctId)) {
      assert.ok(choice.why, `${mission.id}/${choice.id} needs a teaching explanation`);
    }
  }
});
