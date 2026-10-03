import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'osi-interface-'));
const output = join(root, 'work/browser-interface');
let server, browser;
const checks = [],
  errors = [];
function check(name, value) {
  assert.ok(value, name);
  checks.push(name);
}
try {
  await cp(join(root, 'dist'), join(directory, 'clase-redes'), { recursive: true });
  await mkdir(output, { recursive: true });
  server = spawn(
    process.execPath,
    [join(root, 'scripts/dev.mjs'), '--root', directory, '--port', '0'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const [line] = await once(server.stdout, 'data');
  const url = String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0] + '/clase-redes/';
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  const css = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.css')) css.push(request.url());
  });
  async function route(path, selector = 'h1') {
    await page.evaluate((path) => (location.hash = '#/' + path), path);
    await page.waitForSelector(selector);
    await page.waitForFunction(() => !document.querySelector('#main').hasAttribute('aria-busy'));
  }
  await page.goto(url + '#/home');
  await page.waitForSelector('.hero');
  check('Home has one primary action', (await page.locator('#main .button-primary').count()) === 1);
  await page.locator('#profile-menu > summary').click();
  await page.locator('#local-name').fill('Ana <b>');
  await page.locator('#interface-density').selectOption('compact');
  await page.locator('#interface-motion').selectOption('reduce');
  await page.locator('#interface-form button').click();
  check(
    'Name is rendered as text, not markup',
    (await page.locator('#profile-name').innerText()) === 'Ana <b>' &&
      (await page.locator('#profile-name b').count()) === 0,
  );
  check(
    'Preferences acknowledge storage',
    (await page.locator('#interface-status').innerText()) === 'Guardado ✓',
  );
  await page.reload();
  await page.waitForSelector('.hero');
  css.length = 0; // A reload intentionally starts a new document and request cache.
  check(
    'Name and density persist on reload',
    await page.evaluate(
      () =>
        document.querySelector('#profile-name').textContent === 'Ana <b>' &&
        document.documentElement.dataset.density === 'compact',
    ),
  );
  check('Only one skip link leads to main', (await page.locator('.skip-link').count()) === 1);
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  check(
    'Skip link focuses main without becoming a hash route',
    await page.evaluate(
      () =>
        document.activeElement.id === 'main' &&
        location.hash === '#/home' &&
        Boolean(document.querySelector('.hero')),
    ),
  );
  await route('play', '.activity-card');
  check(
    'Empty pending filter is absent',
    (await page.locator('[data-play-filter=due]').count()) === 0,
  );
  const card = page.locator('.activity-card').first();
  await card.locator('summary').click();
  check(
    'Preview explains three playable steps',
    (await card.locator('.activity-preview li').count()) === 3,
  );
  await page.locator('.chapter-picker summary').click();
  check(
    'The first story chapter is available from Play',
    (await page.locator('.chapter-picker a[href="#/story/cable"]').count()) === 1,
  );
  check(
    'Locked chapters are not links',
    (await page.locator('.chapter-picker a[href="#/story/ready"]').count()) === 0,
  );
  await page.screenshot({ path: join(output, 'mobile-play-details.png'), fullPage: true });
  await route('class', '#class-create');
  await page.locator('#class-seed').fill('NO ESPACIOS');
  await page.locator('#class-create button').click();
  check(
    'Class seed error is inline and associated with the input',
    (await page.locator('#class-seed').getAttribute('aria-invalid')) === 'true' &&
      (await page.locator('#class-create-error').innerText()).includes('sin espacios'),
  );
  await page.locator('#class-seed').fill('CLASE7');
  check(
    'Valid input clears its previous error',
    (await page.locator('#class-seed').getAttribute('aria-invalid')) === null,
  );
  await route('setup/duel', '#setup-form');
  await page.locator('#duel-player1').fill('Ana');
  await page.locator('#duel-player2').fill('ana');
  await page.locator('#setup-form button[type=submit]').click();
  check(
    'Two identical participant names have an inline explanation',
    (await page.locator('#duel-player2').getAttribute('aria-invalid')) === 'true',
  );
  await page.locator('#duel-player2').fill('Bea');
  check(
    'Editing the name clears its error',
    (await page.locator('#duel-player-error').innerText()) === '',
  );
  await route('setup/order', '#setup-form');
  await page.locator('[name=difficulty][value=normal]').check();
  await page.locator('[name=direction][value=receive]').check();
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForSelector('[data-layer]');
  for (const number of [1, 2, 3, 4, 5, 6, 7]) {
    await page.locator(`[data-layer="${number}"]`).click();
  }
  await page.waitForSelector('#result-next-round');
  check(
    'A perfect normal round offers hard difficulty',
    (await page.locator('#result-next-round').getAttribute('data-difficulty')) === 'hard',
  );
  check(
    'Normal still awards eight XP per correct layer',
    await page.evaluate(() => JSON.parse(localStorage.getItem('osi-quest-v1')).xp === 56),
  );
  check(
    'Results have one primary action',
    (await page.locator('.result-hero .button-primary').count()) === 1,
  );
  await page.locator('#result-next-round').click();
  await page.waitForSelector('[data-layer]');
  check(
    'The hard invitation actually launches hard difficulty',
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('osi-quest-v1')).difficulty === 'hard',
    ),
  );
  const firstLayer = await page.locator('[data-layer]').first().getAttribute('data-layer');
  await page.goBack();
  await page.waitForSelector('.round-sheet[open]');
  check(
    'Browser Back asks how to handle the open round',
    await page.locator('[data-round-action=continue]').isVisible(),
  );
  await page.locator('[data-round-action=continue]').click();
  check(
    'Continue preserves the unanswered round',
    (await page.locator('[data-layer]').first().getAttribute('data-layer')) === firstLayer,
  );
  await page.locator('[data-round-close]').click();
  await page.locator('[data-round-action=exit]').click();
  await page.waitForSelector('.activity-card');
  for (const screen of ['study', 'explore', 'progress', 'story', 'class', 'play'])
    await route(screen);
  const warmed = css.length;
  const warmLinks = await page.locator('link[rel=stylesheet]').count();
  for (let index = 0; index < 20; index++)
    await route(['study', 'play', 'explore', 'progress', 'story', 'class'][index % 6]);
  check('Twenty navigations request no additional cached stylesheets', css.length === warmed);
  check(
    'Twenty navigations do not duplicate stylesheet links',
    (await page.locator('link[rel=stylesheet]').count()) === warmLinks,
  );
  check('Each shared stylesheet is requested once', new Set(css).size === css.length);
  check('No runtime or resource errors', errors.length === 0);
  const report = {
    passed: checks.length,
    checks,
    errors,
    cache: { navigations: 20, stylesheetRequests: css.length, links: warmLinks },
  };
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  if (server) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
  await rm(directory, { recursive: true, force: true });
}
