import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'osi-visual-'));
const output = join(root, 'work/browser-visual');
const screens = [
  ['study', '.unit-row'],
  ['play', '.activity-card'],
  ['explore', '.explore-card'],
  ['progress', '.stat-card strong'],
  ['story', '.story-chapter'],
  ['class', '.class-grid'],
];
const widths = [320, 390, 768, 1024, 1440];
const properties = [
  'display',
  'gridTemplateColumns',
  'flexDirection',
  'gap',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'fontSize',
  'lineHeight',
  'color',
  'backgroundColor',
  'borderRadius',
  'position',
];
const servers = [],
  differences = [],
  errors = [],
  results = [];
let browser;
async function server(directory) {
  const process = spawn(
    globalThis.process.execPath,
    [join(root, 'scripts/dev.mjs'), '--root', directory, '--port', '0'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  servers.push(process);
  const [line] = await once(process.stdout, 'data');
  return String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0] + '/';
}
try {
  await cp(join(root, 'dist'), join(directory, 'mi-repositorio'), { recursive: true });
  await mkdir(output, { recursive: true });
  const [dev, prod] = await Promise.all([server(root), server(directory)]);
  browser = await chromium.launch();
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    await context.addInitScript(() => {
      localStorage.setItem(
        'osi-quest-v1',
        JSON.stringify({ version: 3, xp: 0, read: [], stats: {}, cards: {} }),
      );
    });
    const pages = await Promise.all([context.newPage(), context.newPage()]);
    for (const page of pages) {
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (r) => {
        if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
      });
    }
    for (const [route, selector] of screens) {
      const snapshots = [];
      for (const [index, page] of pages.entries()) {
        await page.goto((index === 0 ? dev : prod + 'mi-repositorio/') + '#/' + route);
        await page.waitForSelector(selector);
        await page.waitForFunction(
          () => !document.querySelector('#main').hasAttribute('aria-busy'),
        );
        await page.evaluate(() => document.fonts.ready);
        snapshots.push(
          await page.evaluate(
            ({ selector, properties }) => {
              const element = document.querySelector(selector),
                style = getComputedStyle(element);
              return {
                styles: Object.fromEntries(
                  properties.map((property) => [property, style[property]]),
                ),
                width: element.getBoundingClientRect().width,
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
              };
            },
            { selector, properties },
          ),
        );
        await page.screenshot({
          path: join(output, `${route}-${width}-${index === 0 ? 'dev' : 'production'}.png`),
          fullPage: true,
        });
      }
      const mismatch = properties.filter(
        (property) => snapshots[0].styles[property] !== snapshots[1].styles[property],
      );
      if (Math.abs(snapshots[0].width - snapshots[1].width) > 1) mismatch.push('width');
      if (mismatch.length || snapshots.some((s) => s.overflow))
        differences.push({ route, width, mismatch, dev: snapshots[0], production: snapshots[1] });
      results.push({ route, width, match: mismatch.length === 0 });
    }
    await context.close();
  }
  const report = { screens: screens.length, widths, checks: results.length, differences, errors };
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      checks: results.length,
      differences: differences.length,
      errors,
      firstDifference: differences[0],
    }),
  );
  assert.deepEqual(errors, [], 'Screens load without runtime/resource errors');
  if (process.argv.includes('--expect-mismatch'))
    assert.ok(differences.length, 'Baseline reproduces the production CSS regression');
  else
    assert.deepEqual(
      differences,
      [],
      'Computed styles match development and production at all widths',
    );
} finally {
  await browser?.close();
  await Promise.all(
    servers.map(async (server) => {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }),
  );
  await rm(directory, { recursive: true, force: true });
}
