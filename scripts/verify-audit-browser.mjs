import { learningQuestions } from '../src/data/questions/index.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'work/browser-audit');
await mkdir(out, { recursive: true });
const server = spawn(
  process.execPath,
  [join(root, 'scripts/dev.mjs'), '--root', join(root, 'dist'), '--port', '0'],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
const [line] = await once(server.stdout, 'data');
const origin = String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
const browser = await chromium.launch();
const violations = [],
  checks = [],
  errors = [];
try {
  const context = await browser.newContext({ reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  const route = async (path, selector = 'h1') => {
    await page.goto(`${origin}/#/${path}`);
    await page.waitForSelector(selector);
    await page.waitForFunction(
      (path) =>
        document.querySelector('#main').dataset.route === path &&
        !document.querySelector('#main').hasAttribute('aria-busy'),
      path,
    );
  };
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: width === 320 ? 844 : 900 });
    for (const theme of ['light', 'dark', 'contrast', 'system']) {
      await page.emulateMedia({ colorScheme: 'dark' });
      for (const [path, selector] of [
        ['home', '.hero'],
        ['study', '.unit-list'],
        ['play', '.activity-card'],
        ['progress', '.mastery-radar'],
        ['story', '.story-map'],
        ['class', '#class-create'],
        ['explore/journey', '.journey-focus'],
        ['explore/inspector', '#hex-bytes'],
        ['study/basics', '#lesson-notes'],
        ['setup/packet', '#setup-form'],
      ]) {
        await route(path, selector);
        await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        for (const v of result.violations)
          violations.push({
            width,
            theme,
            path,
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          });
        checks.push(`${width}:${theme}:${path}`);
        if (path === 'home' || path === 'explore/journey')
          await page.screenshot({
            path: join(out, `${width}-${theme}-${path.replaceAll('/', '-')}.png`),
            fullPage: true,
          });
      }
    }
  }
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: width === 320 ? 844 : 900 });
    for (const theme of ['light', 'dark', 'contrast', 'system']) {
      for (const kind of ['function', 'packet', 'matching', 'order']) {
        await page.reload();
        await route(`setup/${kind}`, '#setup-form');
        await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
        await page.locator('#setup-form button[type=submit]').click();
        await page.waitForSelector('[data-round-close]');
        await page.waitForFunction(
          () => document.querySelector('#main').dataset.route === 'play/run',
        );
        const states = kind === 'function' ? ['question', 'correct', 'wrong'] : ['question'];
        for (const state of states) {
          if (state !== 'question') {
            if (state === 'wrong') {
              await page.locator('#next-question').click();
              await page.waitForSelector('#hint-button');
            }
            const text = await page.locator('.question-title').innerText();
            const question = learningQuestions.find((q) => q.prompt === text);
            const choice =
              state === 'correct'
                ? question.correctIndex
                : Number(
                    await page
                      .locator(`[data-choice]:not([data-choice="${question.correctIndex}"])`)
                      .first()
                      .getAttribute('data-choice'),
                  );
            await page.locator(`[data-choice="${choice}"]`).click();
            await page.waitForSelector('#question-feedback');
          }
          const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          for (const v of result.violations)
            violations.push({
              width,
              theme,
              path: `${kind}/${state}`,
              id: v.id,
              nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
            });
          checks.push(`${width}:${theme}:${kind}:${state}`);
        }
      }
    }
  }
  await page.reload();
  await page.setViewportSize({ width: 800, height: 360 });
  await route('home', '.hero');
  const reachable = await page.locator('.sidebar-story').evaluate((el) => {
    el.scrollIntoView();
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  });
  assert.ok(reachable, 'Landscape story link is reachable');
  await page.locator('.sidebar-story').click();
  await page.waitForSelector('.story-map');
  await route('setup/function', '#setup-form');
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForSelector('.question-title');
  await writeFile(
    join(out, 'report.json'),
    JSON.stringify({ checks, violations, errors }, null, 2),
  );
  const y = await page.locator('.question-title').evaluate((el) => el.getBoundingClientRect().top);
  assert.ok(y < 180, `Landscape question starts at ${y}`);
  await page.screenshot({ path: join(out, 'landscape-round.png'), fullPage: false });
  const before = await page.locator('.question-title').innerText();
  await page.locator('[data-choice]').first().click();
  await page.waitForSelector('#question-feedback');
  await page.locator('#next-question').click();
  await page.waitForFunction(
    (text) => document.querySelector('.question-title').textContent.trim() !== text,
    before,
  );
  const nextY = await page
    .locator('.question-title')
    .evaluate((el) => el.getBoundingClientRect().top);
  assert.ok(nextY >= 0 && nextY < 180, `Next landscape question starts at ${nextY}`);
  checks.push('landscape navigation and first/next question');
  const tabs = await browser.newContext({ serviceWorkers: 'block' });
  const a = await tabs.newPage(),
    b = await tabs.newPage();
  await Promise.all([a.goto(origin + '/#/study/basics'), b.goto(origin + '/#/study/layer-1')]);
  await Promise.all([a.waitForSelector('#complete-lesson'), b.waitForSelector('#complete-lesson')]);
  await Promise.all([a.locator('#complete-lesson').click(), b.locator('#complete-lesson').click()]);
  await a.goto(origin + '/#/progress');
  await a.waitForSelector('#export-progress');
  const saved = await a.evaluate(() => JSON.parse(localStorage.getItem('osi-quest-v1')));
  assert.ok(
    saved.read.includes('basics') && saved.read.includes('layer-1'),
    'Simultaneous real tabs keep both lessons',
  );
  checks.push('two real tabs simultaneous writes');
  await page.reload();
  for (const path of [
    'study/no-such-lesson',
    'study/basics/99',
    'study/basics/-1',
    'setup/invalid',
    'explore/invalid',
  ]) {
    await route(path);
    assert.ok((await page.locator('h1').innerText()).includes('Por aquí'));
    checks.push('404 ' + path);
  }
  await writeFile(
    join(out, 'report.json'),
    JSON.stringify({ checks, violations, errors }, null, 2),
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(violations, [], 'WCAG violations: see work/browser-audit/report.json');
  console.log(`${checks.length} audit checks passed`);
} finally {
  await browser.close();
  server.kill();
}
