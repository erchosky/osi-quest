import { CLASS_REVISION } from '../src/data/class-revision.js';
import { classModes } from '../src/data/class-modes.js';
import { questions } from '../src/data/questions/index.js';
import { matchingTasks } from '../src/data/matching.js';
import { packetMissions } from '../src/data/packet-missions.js';
import { layers } from '../src/data/layers.js';
import { hashText } from '../src/domain/random.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import {
  styleGroups,
  styleOrder,
  styleDependencies,
  lazyEntries,
  styleLayer,
} from '../scripts/build-assets.mjs';
import { sanitizeInterface } from '../src/services/interface-preferences.js';
import { resultActions } from '../src/features/play/result.js';
import { contextNotice } from '../src/app/notice-priority.js';

test('Every stylesheet has exactly one production owner and the same explicit development cascade', async () => {
  const files = (await readdir(new URL('../src/styles/', import.meta.url)))
    .filter((name) => name.endsWith('.css') && name !== 'index.css')
    .map((name) => name.slice(0, -4));
  const owned = Object.values(styleGroups).flat();
  assert.equal(new Set(owned).size, owned.length, 'No duplicated CSS in lazy groups');
  assert.deepEqual([...owned].sort(), files.sort());
  assert.deepEqual([...styleOrder].sort(), files.sort());
  const dev = await readFile(new URL('../src/styles/index.css', import.meta.url), 'utf8');
  for (const file of styleOrder)
    assert.ok(dev.includes(`'./${file}.css' layer(${styleLayer(file)})`));
  const imports = [...dev.matchAll(/@import '\.\/(.+)\.css'/g)].map((match) => match[1]);
  assert.deepEqual(imports, styleOrder);
  for (const route of Object.keys(lazyEntries).filter((key) => key !== 'factory')) {
    assert.ok(styleDependencies[route]?.length, route);
    for (const dependency of styleDependencies[route])
      assert.ok(styleGroups[dependency], dependency);
  }
});

test('Interface preferences bound untrusted names, density and motion without changing learning progress', () => {
  assert.deepEqual(
    sanitizeInterface({ name: '  Ana\u0000  ', density: 'compact', motion: 'reduce' }),
    { name: 'Ana', density: 'compact', motion: 'reduce', theme: 'system' },
  );
  assert.equal(sanitizeInterface({ name: 'x'.repeat(1000) }).name.length, 24);
  assert.deepEqual(sanitizeInterface(null), {
    name: '',
    density: 'comfortable',
    motion: 'system',
    theme: 'system',
  });
  assert.deepEqual(sanitizeInterface({ name: 12, density: 'malicious', motion: true }), {
    name: '',
    density: 'comfortable',
    motion: 'system',
    theme: 'system',
  });
});

test('Results choose exactly one main action according to evidence and preserve shared challenges', () => {
  const session = { kind: 'function', difficulty: 'normal' };
  const low = resultActions(session, 40, 4);
  assert.match(low, /id="retry-mistakes" class="button button-primary"/);
  const medium = resultActions(session, 80, 1);
  assert.match(medium, /id="result-next-round".*button-primary/);
  const perfect = resultActions(session, 100, 0);
  assert.match(perfect, /data-difficulty="hard"/);
  for (const markup of [low, medium, perfect])
    assert.equal((markup.match(/button-primary/g) || []).length, 1);
  const shared = resultActions({ ...session, challenge: { code: 'OSI2-FIXED' } }, 100, 0);
  assert.equal(shared.includes('data-difficulty="hard"'), false);
  assert.match(shared, /#\/class\/OSI2-FIXED/);
});

test('Storage issues suppress round notices and paused rounds outrank retry context', () => {
  const app = {
    repository: { storageIssue: 'corrupt' },
    activity: { retry: true },
    currentRoute: 'home',
    roundPaused: true,
  };
  assert.equal(contextNotice(app, true), '');
  app.repository.storageIssue = null;
  assert.match(contextNotice(app, false), /paused-round-banner/);
  app.currentRoute = 'play/run';
  assert.match(contextNotice(app, true), /retry-notice/);
});

test('Generated class fingerprint exactly matches the full bank without loading it in the builder', () => {
  assert.equal(
    CLASS_REVISION,
    hashText(JSON.stringify({ classModes, questions, matchingTasks, packetMissions, layers })),
  );
});
