import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { questions } from '../src/data/questions/index.js';
import { emptyProgress, STORAGE_KEY } from '../src/services/progress-schema.js';
import { serializeProgress } from '../src/services/progress-integrity.js';

// Use a disposable Chromium profile: never reads or writes a learner's browser data.
// Run the development server first. --url can point to an older checkout for comparison.
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const url = new URL(option('--url', 'http://127.0.0.1:5173/'));
const output = option('--output', 'work/browser-performance/benchmark.json');
const browser = await chromium.launch();
const results = [];
try {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.route('**/performance-fixture', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Performance fixture</title>',
    }),
  );
  await page.goto(new URL('performance-fixture', url).href);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    // Disable both coordinators to isolate answer cost before automatic compaction.
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: undefined });
  });
  for (const count of [0, 128, 4000]) {
    const base = emptyProgress(),
      time = Date.now() - 60000;
    const entries = [
      [STORAGE_KEY, serializeProgress(base)],
      [
        `${STORAGE_KEY}:base`,
        serializeProgress({ progress: base, applied: [], epoch: 'benchmark' }),
      ],
    ];
    for (let i = 0; i < count; i++)
      entries.push([
        `${STORAGE_KEY}:operation:${String(i).padStart(6, '0')}`,
        serializeProgress({
          method: 'recordAnswer',
          epoch: 'benchmark',
          args: [{ question: questions[0], correct: true, difficulty: 'normal' }, 'function'],
          time: time + i,
          order: (time + i) * 1024,
        }),
      ]);
    await page.evaluate((entries) => {
      localStorage.clear();
      for (const [key, value] of entries) localStorage.setItem(key, value);
    }, entries);
    const measurements = await page.evaluate(
      async ({ question, moduleURL }) => {
        const { createProgressRepository } = await import(moduleURL);
        const start = performance.now();
        const repo = createProgressRepository(localStorage);
        const startupMs = performance.now() - start;
        const timings = [];
        for (let i = 0; i < 20; i++) {
          const start = performance.now();
          repo.recordAnswer({ question, correct: true, difficulty: 'normal' }, 'function');
          timings.push(performance.now() - start);
        }
        timings.sort((a, b) => a - b);
        return { startupMs, medianActionMs: timings[10], xp: repo.data.xp };
      },
      {
        question: questions[0],
        moduleURL: new URL('src/services/progress-repository.js', url).href,
      },
    );
    results.push({ count, cpuThrottle: 4, ...measurements });
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
