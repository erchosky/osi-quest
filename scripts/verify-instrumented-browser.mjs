// Production-only checks: hashed resources, repository prefix, lazy route races
// and transfer budget. Run after `npm run build`, with optional Playwright.
import assert from 'node:assert/strict';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { gzipSync } from 'node:zlib';
const { chromium } = await import(process.env.OSI_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'osi-production-'));
let preview, browser;
const errors = [],
  resources = [],
  pending = [];
let checks = 0;
const check = (label, condition) => {
  assert.ok(condition, label);
  checks++;
};
try {
  await cp(join(root, 'dist-test'), join(directory, 'mi-repositorio'), { recursive: true });
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  preview = spawn(
    process.execPath,
    [join(root, 'scripts/dev.mjs'), '--root', directory, '--port', String(port)],
    { stdio: 'ignore' },
  );
  const url = `http://127.0.0.1:${port}/mi-repositorio/`;
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      ready = (await fetch(url)).ok;
    } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  check('Production server starts', ready);
  browser = await chromium.launch();
  // Fault-injection needs direct network loads. Offline/SW behavior has its own suites.
  const page = await browser.newPage({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    if (/\.(js|css)$/.test(response.url()))
      pending.push(
        response.body().then((body) =>
          resources.push({
            url: response.url(),
            bytes: body.length,
            gzip: gzipSync(body).length,
          }),
        ),
      );
  });
  const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const route = async (path) => {
    await page.evaluate((value) => {
      location.hash = `/${value}`;
    }, path);
    await page.waitForFunction(
      (value) => JSON.parse(window.render_game_to_text()).route === value,
      path,
    );
  };
  await page.goto(url);
  await page.waitForFunction(
    () =>
      typeof render_game_to_text === 'function' &&
      JSON.parse(render_game_to_text()).route === 'home',
  );
  await page.waitForLoadState('networkidle');
  await Promise.all(pending);
  const home = resources.slice();
  check(
    'Homepage loads hashed JS and CSS',
    home.some((file) => /main-[A-Z0-9]+\.js$/.test(file.url)) &&
      home.some((file) => /core-[A-Z0-9]+\.css$/.test(file.url)),
  );
  check(
    'All initial assets keep repository prefix',
    home.every((file) => file.url.startsWith(url + 'assets/')),
  );
  check(
    'Initial JS/CSS gzip estimate stays below 128 KiB',
    home.reduce((sum, file) => sum + file.gzip, 0) < 128 * 1024,
  );
  check('Initial module requests stay at most three', home.length <= 3);
  // An old module response must never replace a newer navigation.
  await page.route('**/assets/chunks/*', async (request) => {
    await new Promise((resolve) => setTimeout(resolve, 120));
    await request.continue();
  });
  await page.evaluate(() => {
    location.hash = '/study/url';
  });
  await page.waitForFunction(
    () => document.querySelector('#main').getAttribute('aria-busy') === 'true',
  );
  await route('progress');
  await page.waitForTimeout(350);
  check(
    'Latest route wins competing imports',
    (await state()).route === 'progress' &&
      (await page.locator('h1').innerText()).includes('progreso'),
  );
  await page.unroute('**/assets/chunks/*');
  await route('study/url/1');
  check(
    'Lesson content and section navigation work in production',
    (await page.locator('#lesson-section-1').count()) === 1,
  );
  await route('explore/glossary');
  check(
    'Deferred dictionary renders under prefix',
    (await page.locator('#glossary-search').count()) === 1,
  );
  await route('class');
  await page.locator('#class-create button[type=submit]').click();
  await page.waitForSelector('#class-code');
  check(
    'New classroom format reaches production',
    (await page.locator('#class-code').inputValue()).startsWith('OSI2-'),
  );
  check(
    'Shared link retains repository prefix',
    (await page.locator('#class-link').inputValue()).startsWith(url),
  );
  await route('setup/function');
  await page.locator('input[value=hard]').check();
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForFunction(() => JSON.parse(render_game_to_text()).route === 'play/run');
  check(
    'Deferred session and quiz load',
    (await state()).difficulty === 'hard' && (await page.locator('[data-choice]').count()) === 4,
  );
  await page.locator('[data-choice]').first().click();
  check(
    'Production reveals contextual learning feedback',
    (await page.locator('#question-feedback [data-revealed-layer]').count()) === 1,
  );
  await page.locator('[data-round-close]').click();
  await page.locator('[data-round-action=exit]').click();
  await page.waitForFunction(() => JSON.parse(render_game_to_text()).route === 'play');
  await page.reload();
  await page.waitForFunction(
    () =>
      typeof render_game_to_text === 'function' &&
      JSON.parse(render_game_to_text()).route === 'play',
  );
  check(
    'Preferences survive compiled-page reload',
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('osi-quest-v1')).activityPreferences.function.difficulty ===
        'hard',
    ),
  );
  await page.waitForLoadState('networkidle');
  check('Production has no resource or runtime errors', errors.length === 0);
  // A missing route chunk has a visible recovery screen, and reloading after
  // restoring the resource keeps saved progress. This page expects one abort.
  const failure = await browser.newPage({ serviceWorkers: 'block' });
  await failure.addInitScript(() =>
    localStorage.setItem(
      'osi-quest-v1',
      JSON.stringify({ version: 3, xp: 88, read: [], stats: {}, cards: {} }),
    ),
  );
  await failure.route('**/assets/study-*.js', (request) => request.abort());
  await failure.goto(url + '#/study/url');
  await failure.waitForSelector('#retry-screen');
  check(
    'Missing deferred screen exposes recovery instead of an empty page',
    (await failure.locator('h1').innerText()).includes('No se pudo abrir') &&
      (await failure.locator('#main').getAttribute('aria-busy')) === null,
  );
  await failure.unroute('**/assets/study-*.js');
  await failure.locator('#retry-screen').click();
  await failure.waitForFunction(
    () =>
      typeof render_game_to_text === 'function' &&
      JSON.parse(render_game_to_text()).route === 'study/url',
  );
  check(
    'Reload recovers the route and preserves stored XP',
    (await failure.locator('#lesson-notes').count()) === 1 &&
      (await failure.evaluate(() => JSON.parse(localStorage.getItem('osi-quest-v1')).xp === 88)),
  );
  await failure.close();

  // Keep this isolated from transfer accounting and the ordinary preference test.
  // A slow session import must not start a game after the user navigates away.
  const launchRace = await browser.newPage({ serviceWorkers: 'block' });
  await launchRace.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true } });
    localStorage.setItem(
      'osi-quest-v1',
      JSON.stringify({
        version: 3,
        xp: 88,
        difficulty: 'normal',
        activityPreferences: { function: { difficulty: 'normal' } },
        read: [],
        stats: {},
        cards: {},
      }),
    );
  });
  let releaseFactory;
  const heldFactory = new Promise((resolve) => {
    releaseFactory = resolve;
  });
  await launchRace.route('**/assets/factory-*.js', async (request) => {
    await heldFactory;
    await request.continue();
  });
  await launchRace.goto(url + '#/setup/function');
  await launchRace.waitForSelector('#setup-form');
  const originalProgress = await launchRace.evaluate(() => localStorage.getItem('osi-quest-v1'));
  await launchRace.locator('input[value=hard]').check();
  const factoryRequest = launchRace.waitForRequest((request) =>
    /factory-[A-Z0-9]+\.js$/.test(request.url()),
  );
  await launchRace.locator('#setup-form button[type=submit]').click();
  await factoryRequest;
  await launchRace.evaluate(() => {
    location.hash = '/progress';
  });
  await launchRace.waitForFunction(() => JSON.parse(render_game_to_text()).route === 'progress');
  const factoryResponse = launchRace.waitForResponse((response) =>
    /factory-[A-Z0-9]+\.js$/.test(response.url()),
  );
  releaseFactory();
  await factoryResponse;
  await launchRace.waitForLoadState('networkidle');
  check(
    'Changing navigation while the session loads cancels its launch',
    await launchRace.evaluate(
      () =>
        location.hash === '#/progress' && JSON.parse(render_game_to_text()).route === 'progress',
    ),
  );
  check(
    'Cancelled launch preserves preferences and creates no hidden unfinished round',
    await launchRace.evaluate((original) => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return localStorage.getItem('osi-quest-v1') === original && !event.defaultPrevented;
    }, originalProgress),
  );
  await launchRace.close();

  // The session can be ready before its first view chunk. Leaving at that point
  // must still use the round sheet and preserve the created question on resume.
  const screenRace = await browser.newPage({ serviceWorkers: 'block' });
  await screenRace.addInitScript(() => {
    Math.random = () => 0.25;
  });
  let releaseQuiz;
  const heldQuiz = new Promise((resolve) => {
    releaseQuiz = resolve;
  });
  let signalQuizRequest;
  const quizRequest = new Promise((resolve) => {
    signalQuizRequest = resolve;
  });
  let heldFirstView = false;
  await screenRace.route('**/assets/quiz-*.js', async (request) => {
    if (!heldFirstView) {
      heldFirstView = true;
      signalQuizRequest();
      await heldQuiz;
    }
    await request.continue();
  });
  await screenRace.goto(url + '#/setup/function');
  await screenRace.waitForSelector('#setup-form');
  await screenRace.locator('#setup-form button[type=submit]').click();
  await quizRequest;
  // Prefetch may request the view before session creation; hold the view until
  // a real session exists so this exercises the intended navigation boundary.
  await screenRace.waitForFunction(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  await screenRace.evaluate(() => {
    location.hash = '/progress';
  });
  await screenRace.waitForSelector('[data-round-action=pause]');
  check(
    'Leaving before the first game screen loads still asks how to handle the round',
    await screenRace.locator('dialog[open] [data-round-action=pause]').isVisible(),
  );
  await screenRace.locator('[data-round-action=pause]').click();
  await screenRace.waitForFunction(() => JSON.parse(render_game_to_text()).route === 'progress');
  releaseQuiz();
  await screenRace.waitForLoadState('networkidle');
  check(
    'Pending game view cannot overwrite the paused screen or hide its resume action',
    (await screenRace.evaluate(() => JSON.parse(render_game_to_text()).roundPaused)) &&
      (await screenRace.locator('[data-resume-round]').count()) === 1,
  );
  await screenRace.locator('[data-resume-round]').click();
  await screenRace.waitForFunction(() => JSON.parse(render_game_to_text()).route === 'play/run');
  check(
    'Resume returns to the original created question after its deferred view finishes',
    await screenRace.evaluate(() => {
      const game = JSON.parse(render_game_to_text());
      return (
        !game.roundPaused &&
        game.activity.kind === 'function' &&
        game.activity.index === 0 &&
        game.activity.total === 7 &&
        game.activity.questionId === 'normal-function-4-extra'
      );
    }),
  );
  await screenRace.close();

  console.log(
    JSON.stringify({
      passed: checks,
      initialRequests: home.length,
      initialBytes: home.reduce((sum, file) => sum + file.bytes, 0),
      initialGzipEstimate: home.reduce((sum, file) => sum + file.gzip, 0),
      errors,
    }),
  );
} finally {
  await browser?.close();
  if (preview) {
    const exited = new Promise((resolve) => preview.once('exit', resolve));
    preview.kill();
    await exited;
  }
  await rm(directory, { recursive: true, force: true });
}
