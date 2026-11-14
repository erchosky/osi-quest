import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { questions } from '../src/data/questions/index.js';
import { emptyProgress, STORAGE_KEY } from '../src/services/progress-schema.js';
import { serializeProgress } from '../src/services/progress-integrity.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'work/browser-performance');
const server = spawn(process.execPath, [join(root, 'scripts/dev.mjs'), '--port', '0'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
const [line] = await once(server.stdout, 'data');
const origin = String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
const browser = await chromium.launch();
const errors = [],
  report = {};
let checks = 0;
const check = (label, value) => {
  assert.ok(value, label);
  checks++;
};
const question = questions[0];
async function fixture(context) {
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/performance-fixture', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Storage fixture</title>',
    }),
  );
  await page.goto(origin + '/performance-fixture');
  return page;
}
async function initialize(page) {
  await page.evaluate(async () => {
    const { createProgressRepository } = await import('/src/services/progress-repository.js');
    window.repo = createProgressRepository(localStorage);
  });
}
const operationCount = () =>
  Object.keys(localStorage).filter((key) => key.startsWith('osi-quest-v1:operation:')).length;
const answer = async (page, count, difficulty = 'normal') =>
  page.evaluate(
    ({ question, count, difficulty }) => {
      for (let i = 0; i < count; i++)
        window.repo.recordAnswer({ question, correct: true, difficulty }, 'function');
    },
    { question, count, difficulty },
  );
try {
  await mkdir(out, { recursive: true });
  // Two real pages, real localStorage and real IndexedDB; deliberately no Web Locks.
  const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
  });
  const a = await fixture(context),
    b = await fixture(context);
  await initialize(a);
  await initialize(b);
  await Promise.all([answer(a, 150), answer(b, 150, 'hard')]);
  await a.waitForFunction(
    () =>
      Object.keys(localStorage).filter((key) => key.startsWith('osi-quest-v1:operation:')).length <
      128,
  );
  for (const page of [a, b]) {
    const data = await page.evaluate(() => {
      window.repo.synchronize();
      return window.repo.data;
    });
    check('No-lock concurrent answers preserve all normal/hard XP', data.xp === 150 * 28);
    check('No-lock concurrent answers preserve each attempt', data.stats[question.id].seen === 300);
  }
  check(
    'IndexedDB actually coordinates the fallback',
    await a.evaluate(async () =>
      (await indexedDB.databases()).some((db) => db.name === 'osi-quest-v1:maintenance'),
    ),
  );
  report.noLocksRemainingKeys = await a.evaluate(operationCount);
  await context.close();

  // Migrate an old, large full-question log. Reload must use the compacted base.
  const legacy = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
  await legacy.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
  });
  const page = await fixture(legacy);
  const base = emptyProgress(),
    time = Date.now() - 60000;
  const entries = [
    [STORAGE_KEY, serializeProgress(base)],
    [`${STORAGE_KEY}:base`, serializeProgress({ progress: base, applied: [], epoch: 'legacy' })],
  ];
  for (let i = 0; i < 4000; i++)
    entries.push([
      `${STORAGE_KEY}:operation:${String(i).padStart(6, '0')}`,
      serializeProgress({
        method: 'recordAnswer',
        epoch: 'legacy',
        args: [{ question, correct: true, difficulty: 'normal' }, 'function'],
        time: time + i,
        order: (time + i) * 1024,
      }),
    ]);
  await page.evaluate((entries) => {
    for (const [key, value] of entries) localStorage.setItem(key, value);
  }, entries);
  await page.goto(origin + '/dist/#/story');
  await page.waitForSelector('.story-map');
  await page.waitForFunction(
    () =>
      Object.keys(localStorage).filter((key) => key.startsWith('osi-quest-v1:operation:')).length <
      128,
  );
  report.migratedKeys = await page.evaluate(operationCount);
  check('Production compacts legacy history on startup', report.migratedKeys === 0);
  await page.reload();
  await page.waitForSelector('.story-map');
  await initialize(page);
  const data = await page.evaluate(() => window.repo.data);
  check('Migration and reload preserve all legacy XP', data.xp === 32000);
  check('Migration and reload preserve all legacy attempts', data.stats[question.id].seen === 4000);
  await page.evaluate(() => {
    location.hash = '/setup/function';
  });
  await page.waitForSelector('#setup-form');
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForSelector('[data-choice]');
  await page.locator('[data-choice]').first().click();
  await page.waitForSelector('#question-feedback');
  await page.screenshot({ path: join(out, 'legacy-history-answer.png'), fullPage: true });
  check(
    'Gameplay remains interactive after migration',
    await page.locator('#next-question').isVisible(),
  );
  await legacy.close();

  // A interrupted delete leaves applied IDs, so another tab/reload cannot double-count answers.
  const interrupted = await browser.newContext({ serviceWorkers: 'block' });
  await interrupted.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
  });
  const partial = await fixture(interrupted);
  await partial.evaluate(async () => {
    const { createProgressRepository } = await import('/src/services/progress-repository.js');
    let fail = true;
    const storage = {
      get length() {
        return localStorage.length;
      },
      key: (index) => localStorage.key(index),
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => {
        if (fail && key.includes(':operation:')) {
          fail = false;
          throw new Error('interrupted');
        }
        localStorage.removeItem(key);
      },
    };
    window.repo = createProgressRepository(storage);
  });
  await answer(partial, 150);
  await partial.waitForFunction(
    () => JSON.parse(localStorage.getItem('osi-quest-v1:base')).applied.length === 150,
  );
  await initialize(partial);
  check(
    'Interrupted no-lock compaction does not duplicate XP',
    await partial.evaluate(() => window.repo.data.xp === 1200),
  );
  await answer(partial, 128);
  await partial.waitForFunction(
    () =>
      Object.keys(localStorage).filter((key) => key.startsWith('osi-quest-v1:operation:'))
        .length === 0,
  );
  await initialize(partial);
  check(
    'Next compaction removes leftover applied keys safely',
    await partial.evaluate(() => window.repo.data.xp === 278 * 8),
  );
  await interrupted.close();

  // Observe actual production renders while another tab emits a burst of 400 storage events.
  const burst = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
  const target = await burst.newPage();
  target.on('pageerror', (error) => errors.push(error.message));
  await target.goto(origin + '/dist/#/story');
  await target.waitForSelector('.story-map');
  await target.evaluate(() => {
    window.refreshCount = 0;
    new MutationObserver((changes) => {
      window.refreshCount += changes.filter(
        (change) => change.type === 'childList' && change.target.id === 'main',
      ).length;
    }).observe(document.querySelector('#main'), { childList: true });
  });
  const writer = await fixture(burst);
  await writer.evaluate(() => {
    for (let i = 0; i < 400; i++) {
      const key = 'osi-quest-v1:performance-event';
      localStorage.setItem(key, String(i));
    }
    localStorage.removeItem('osi-quest-v1:performance-event');
  });
  await target.waitForFunction(() => window.refreshCount > 0);
  await target.waitForTimeout(250);
  report.rendersFor401Events = await target.evaluate(() => window.refreshCount);
  check(
    'Storage bursts refresh the production screen at most four times',
    report.rendersFor401Events <= 4,
  );
  await burst.close();
  check('Performance scenarios have no runtime errors', errors.length === 0);
  await writeFile(join(out, 'report.json'), JSON.stringify({ checks, ...report, errors }, null, 2));
  console.log(JSON.stringify({ checks, ...report, errors }));
} finally {
  await browser.close();
  server.kill('SIGTERM');
}
