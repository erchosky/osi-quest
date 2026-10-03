import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { questionById } from '../src/data/questions/index.js';
const root = fileURLToPath(new URL('../', import.meta.url)),
  dir = await mkdtemp(join(tmpdir(), 'osi-v38-')),
  out = join(root, 'work/browser-v38');
const checks = [],
  errors = [];
let browser, server;
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
};
try {
  await cp(join(root, 'dist'), join(dir, 'redes'), { recursive: true });
  await cp(join(root, 'dist-test'), join(dir, 'testing'), { recursive: true });
  await mkdir(out, { recursive: true });
  server = spawn(process.execPath, [join(root, 'scripts/dev.mjs'), '--root', dir, '--port', '0'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const [line] = await once(server.stdout, 'data');
  const origin = String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  const route = async (path, selector = 'h1') => {
    await page.evaluate((p) => (location.hash = '#/' + p), path);
    await page.waitForSelector(selector);
    await page.waitForFunction(() => !document.querySelector('#main').hasAttribute('aria-busy'));
  };
  await page.goto(origin + '/redes/');
  await page.waitForSelector('.hero');
  await page.waitForFunction(() => navigator.serviceWorker.controller, { timeout: 20000 });
  await page.waitForFunction(() =>
    document.querySelector('#offline-status').textContent.includes('listo sin conexión'),
  );
  check(
    'PWA controls the app under a repository prefix',
    await page.evaluate(() =>
      navigator.serviceWorker.controller.scriptURL.includes('/redes/sw.js'),
    ),
  );
  const manifest = await (
    await page.request.get(origin + '/redes/public/manifest.webmanifest')
  ).json();
  check(
    'Manifest provides standalone launch and proper relative scope',
    manifest.display === 'standalone' && manifest.scope === '../' && manifest.icons.length === 2,
  );
  check(
    'All published modules are cached before claiming offline readiness',
    await page.evaluate(async () => {
      const names = await caches.keys();
      const c = await caches.open(names.find((n) => n.includes('/redes/')));
      return (await c.keys()).length >= 60;
    }),
  );
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('.hero');
  check('Cold document reload works without network', (await page.locator('.hero').count()) === 1);
  for (const [path, selector] of [
    ['study/layer-4', '#complete-lesson'],
    ['play', '.activity-card'],
    ['explore/inspector', '#hex-bytes'],
    ['progress', '#export-progress'],
    ['story', '.story-chapters'],
    ['class', '#class-create'],
  ]) {
    await route(path, selector);
    check('Previously unvisited screen works offline: ' + path, true);
  }
  await route('explore/inspector', '#packet-fields');
  await page.locator('[data-field]').filter({ hasText: 'Puerto destino' }).click();
  check(
    'Inspector field links bytes, value and layer',
    await page
      .locator('#packet-detail')
      .innerText()
      .then((t) => t.includes('80') && t.includes('Capa 4')),
  );
  check(
    'Two destination-port bytes highlighted',
    (await page.locator('.hex-byte.selected').count()) === 2,
  );
  await page.locator('[data-inspect-answer="MAC destino"]').click();
  check(
    'Inspector guided challenge explains the MAC/IP distinction',
    (await page.locator('#inspect-feedback').innerText()).startsWith('Correcto.'),
  );
  await page.locator('details.panel summary').click();
  await page.locator('#hex-input').fill('<img src=x onerror=alert(1)>');
  await page.locator('#hex-form button').first().click();
  check(
    'Malformed pasted hex shows inline error',
    await page
      .locator('#hex-error')
      .innerText()
      .then((t) => t.includes('hexadecimales')),
  );
  check(
    'Invalid input does not replace the valid frame',
    (await page.locator('.hex-byte').count()) > 50,
  );
  await page.screenshot({ path: join(out, 'inspector-light.png'), fullPage: true });
  for (const theme of ['dark', 'contrast', 'light', 'system']) {
    await page.locator('#profile-menu summary').first().click();
    await page.locator('#interface-theme').selectOption(theme);
    await page.locator('#interface-form button').click();
    check(
      'Theme selection applied ' + theme,
      await page.evaluate((t) => document.documentElement.dataset.theme === t, theme),
    );
    await page.locator('#profile-menu summary').first().click();
    if (theme === 'dark' || theme === 'contrast')
      await page.screenshot({ path: join(out, 'inspector-' + theme + '.png'), fullPage: true });
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  check(
    'System dark responds dynamically',
    await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme === 'dark'),
  );
  await page.emulateMedia({ colorScheme: 'light' });
  check(
    'System light responds dynamically',
    await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme === 'light'),
  );
  await route('setup/focus?layer=4', '#setup-form');
  check(
    'Layer map configuration selects requested layer',
    (await page.locator('#focus-layer').inputValue()) === '4',
  );
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForSelector('[data-choice]');
  await page.locator('[data-choice]').first().click();
  check(
    'Focused round reveals only the requested layer',
    (await page.locator('[data-revealed-layer="4"]').count()) === 1,
  );
  await page.locator('[data-round-close]').click();
  await page.locator('[data-round-action=exit]').click();
  await page.waitForSelector('.activity-card');
  // Separate instrumented context: deterministic clock checks do not publish answer keys.
  await context.setOffline(false);
  await context.close();
  const testing = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const game = await testing.newPage();
  game.on('pageerror', (e) => errors.push(e.message));
  await game.goto(origin + '/testing/#/setup/speedrun');
  await game.waitForSelector('#setup-form');
  await game.locator('#setup-form button[type=submit]').click();
  await game.waitForSelector('[data-choice]');
  let state = JSON.parse(await game.evaluate(() => render_game_to_text()));
  check('Sprint starts globally at 60 seconds', state.activity.remainingMs > 59000);
  let question = questionById.get(state.activity.questionId);
  await game.locator(`[data-choice="${question.correctIndex}"]`).click();
  state = JSON.parse(await game.evaluate(() => render_game_to_text()));
  check(
    'Correct layer gives normal XP and chain bonus',
    state.xp === 8 && state.activity.chain === 1 && state.activity.remainingMs > 60000,
  );
  await game.evaluate(() => advanceTime(2000));
  let after = JSON.parse(await game.evaluate(() => render_game_to_text()));
  check(
    'Sprint keeps counting while explanation is visible',
    after.activity.remainingMs < state.activity.remainingMs - 1500,
  );
  await game.locator('[data-round-close]').click();
  await game.locator('[data-round-action=pause]').click();
  await game.waitForSelector('.activity-card');
  const paused = JSON.parse(await game.evaluate(() => render_game_to_text()));
  await game.evaluate(() => advanceTime(50000));
  await game.locator('[data-resume-round]').click();
  await game.waitForSelector('#speedrun-time');
  after = JSON.parse(await game.evaluate(() => render_game_to_text()));
  check(
    'Pausing preserves countdown and answers',
    after.activity.remainingMs > 58000 && after.activity.answered,
  );
  await game.locator('#next-question').click();
  await game.evaluate(() => advanceTime(70000));
  await game.waitForSelector('.result-hero');
  check(
    'Timeout finishes and persists useful report without late reward',
    JSON.parse(await game.evaluate(() => render_game_to_text())).activity.done,
  );
  check(
    'Sprint reviews correct answers as well as errors',
    (await game.locator('.review-card').count()) === 1,
  );
  await game.screenshot({ path: join(out, 'sprint-result.png'), fullPage: true });
  await game.evaluate(() => (location.hash = '#/setup/speedrun'));
  await game.waitForSelector('#setup-form');
  await game.locator('input[value=hard]').check();
  await game.locator('#setup-form button[type=submit]').click();
  await game.waitForSelector('[data-choice]');
  state = JSON.parse(await game.evaluate(() => render_game_to_text()));
  question = questionById.get(state.activity.questionId);
  await game.locator(`[data-choice="${question.correctIndex}"]`).click();
  check(
    'Hard sprint gives more XP than normal',
    JSON.parse(await game.evaluate(() => render_game_to_text())).xp === 28,
  );
  await game.screenshot({ path: join(out, 'sprint-mobile.png'), fullPage: true });
  await game.locator('[data-round-close]').click();
  await game.locator('[data-round-action=exit]').click();
  await game.waitForSelector('.activity-card');
  await game.evaluate(() => (location.hash = '#/setup/speedrun'));
  await game.waitForSelector('#setup-form');
  await game.locator('#setup-form button[type=submit]').click();
  await game.waitForSelector('[data-choice]');
  await game.evaluate(() => advanceTime(61000));
  await game.waitForSelector('.result-hero');
  check(
    'Zero-attempt timeout renders a valid result',
    !(await game.locator('#main').innerText()).includes('NaN'),
  );
  check('No runtime or security-policy console errors', errors.length === 0);
  await writeFile(join(out, 'report.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, errors, output: out }));
} finally {
  await browser?.close();
  server?.kill();
  await rm(dir, { recursive: true, force: true });
}
