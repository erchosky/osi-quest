// Optional browser verification: install Playwright separately; no runtime dependency.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createChallenge, CLASS_REVISION } from '../src/domain/class-challenge.js';
import { classModes } from '../src/data/class-modes.js';
import { questions } from '../src/data/questions/index.js';

const { chromium } = await import(process.env.OSI_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.OSI_TEST_URL || 'http://127.0.0.1:5173/';
const screenshots =
  process.env.OSI_SCREENSHOT_DIR ||
  fileURLToPath(new URL('../work/browser-class/', import.meta.url));
await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const checks = [];
function check(label, value = true) {
  assert.ok(value, label);
  checks.push(label);
}
async function newParticipant(xp) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('requestfailed', (request) => errors.push(request.failure().errorText));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(response.url());
  });
  await page.goto(base);
  await page.evaluate(
    (value) =>
      localStorage.setItem(
        'osi-quest-v1',
        JSON.stringify({ version: 3, xp: value, stats: {}, cards: {}, read: [] }),
      ),
    xp,
  );
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  return page;
}
const state = (page) => page.evaluate(() => JSON.parse(window.render_game_to_text()));
async function route(page, path) {
  const before = await state(page);
  if (
    before.route === 'play/run' &&
    before.activity &&
    !before.activity.done &&
    !before.roundPaused &&
    path !== 'play/run'
  ) {
    await page.locator('[data-round-close]').click();
    await page.locator('[data-round-action=exit]').click();
    await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).route !== 'play/run');
  }
  await page.evaluate((value) => (location.hash = `/${value}`), path);
  const decoded = path.split('/').map(decodeURIComponent).join('/');
  await page.waitForFunction(
    (value) => JSON.parse(window.render_game_to_text()).route === value,
    decoded,
  );
}
async function start(page, code) {
  await route(page, `class/${code}`);
  await page.locator('#class-start').click();
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).route === 'play/run');
}
async function shot(page, name) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `${screenshots}/${name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
}

try {
  const first = await newParticipant(1200);
  const second = await newParticipant(0);
  await route(first, 'play');
  await first.locator('.class-entry a').click();
  await first.locator('#class-mode').selectOption('EXA');
  await first.locator('#class-difficulty').selectOption('hard');
  await first.locator('#class-seed').fill('clase1');
  await shot(first, 'crear-reto');
  await first.locator('#class-create button[type=submit]').click();
  await first.locator('#class-code').waitFor();
  const code = await first.locator('#class-code').inputValue();
  check(
    'Builder preserves activity, difficulty and normalized seed',
    code === createChallenge({ mode: 'EXA', difficulty: 'hard', seed: 'CLASE1' }).code,
  );
  const link = await first.locator('#class-link').inputValue();
  await first.locator('[data-class-copy="#class-code"]').click();
  await first.waitForFunction(
    () => document.querySelector('#class-copy-status').textContent === 'Código copiado.',
  );
  check(
    'Copy code uses actual clipboard',
    (await first.evaluate(() => navigator.clipboard.readText())) === code,
  );
  await first.locator('[data-class-copy="#class-link"]').click();
  await first.waitForFunction(
    () => document.querySelector('#class-copy-status').textContent === 'Enlace copiado.',
  );
  check(
    'Copy link uses actual clipboard',
    (await first.evaluate(() => navigator.clipboard.readText())) === link,
  );
  await shot(first, 'invitacion');
  await route(second, 'class');
  await second.locator('#class-import').fill(link);
  await second.locator('#class-join button').click();
  await second.locator('#class-code').waitFor();
  check(
    'Another participant can paste the full invitation link',
    (await second.locator('#class-code').inputValue()) === code,
  );

  await start(first, code);
  await start(second, code);
  check(
    'Both start the same seeded round',
    (await state(first)).activity.challengeCode === code &&
      (await state(second)).activity.challengeCode === code,
  );
  await shot(first, 'examen-compartido');
  for (let index = 0; index < 15; index++) {
    const a = (await state(first)).activity;
    const b = (await state(second)).activity;
    assert.deepEqual(a, b);
    check(`Exam question ${index + 1} and answer options match across participants`);
    const correct = questions.find((question) => question.id === a.questionId).correctIndex;
    await first.locator(`[data-choice="${correct}"]`).click();
    check(`Answer ${index + 1} stays private`, !(await state(second)).activity.answered);
    await second.locator(`[data-choice="${correct}"]`).click();
    await first.locator('#next-question').click();
    await second.locator('#next-question').click();
  }
  check(
    'Exam withholds XP until submitted',
    (await state(first)).xp === 1200 && (await state(second)).xp === 0,
  );
  await first.locator('#submit-exam').click();
  await second.locator('#submit-exam').click();
  check(
    'Participants retain separate results and XP',
    (await state(first)).xp === 1500 && (await state(second)).xp === 300,
  );
  check(
    'Completed shared results offer the same challenge again',
    (await first.getByRole('link', { name: 'Volver al mismo reto' }).count()) === 1,
  );
  await first.getByRole('link', { name: 'Volver al mismo reto' }).click();
  await first.locator('#class-start').click();
  await first.waitForFunction(() => JSON.parse(window.render_game_to_text()).route === 'play/run');
  check(
    'Reopening starts a fresh independent exam',
    (await state(first)).activity.index === 0 && !(await state(first)).activity.answered,
  );

  for (const mode of classModes) {
    for (const difficulty of mode.kind === 'cases' ? ['normal'] : ['normal', 'hard']) {
      const challenge = createChallenge({ mode: mode.id, difficulty, seed: 'EQUIPO2' });
      await start(first, challenge.code);
      await start(second, challenge.code);
      assert.deepEqual((await state(first)).activity, (await state(second)).activity);
      if (mode.kind === 'order')
        assert.deepEqual(
          await first.locator('[data-layer]').allTextContents(),
          await second.locator('[data-layer]').allTextContents(),
        );
      if (mode.kind === 'matching')
        assert.deepEqual(
          await first.locator('[data-match-layer]').allTextContents(),
          await second.locator('[data-match-layer]').allTextContents(),
        );
      check(`${mode.id}/${difficulty} starts identical content and visible options`);
    }
  }
  await route(first, 'class');
  await first.locator('#class-mode').selectOption('CAS2');
  check(
    'Guided cases fix normal difficulty',
    (await first.locator('#class-difficulty').isDisabled()) &&
      (await first.locator('#class-difficulty').inputValue()) === 'normal',
  );
  await first.locator('#class-mode').selectOption('CON');
  check(
    'Other modes restore difficulty selection',
    await first.locator('#class-difficulty').isEnabled(),
  );
  await first.locator('#class-import').fill('invalid');
  await first.locator('#class-join button').click();
  check(
    'Invalid pasted codes show a useful error',
    (await first.locator('#class-join-error').innerText()).includes('no es válido'),
  );
  const incompatible = code.replace(
    CLASS_REVISION,
    CLASS_REVISION === '00000000' ? 'FFFFFFFF' : '00000000',
  );
  await route(first, `class/${incompatible}`);
  check(
    'Incompatible content prevents starting a different round',
    (await first.locator('#class-start').count()) === 0 &&
      (await first.locator('main').innerText()).includes('otra versión'),
  );
  await route(first, 'class/%3Cscript%3E');
  check(
    'Malformed link fails safely',
    (await first.locator('#class-start').count()) === 0 &&
      (await first.locator('main script').count()) === 0,
  );

  await route(first, `class/${code}`);
  await first.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('blocked')) },
    }),
  );
  await first.locator('[data-class-copy="#class-code"]').click();
  await first.waitForFunction(() => document.activeElement.id === 'class-code');
  check(
    'Unavailable clipboard offers selectable text',
    await first.evaluate(() => {
      const field = document.querySelector('#class-code');
      return field.selectionEnd - field.selectionStart === field.value.length;
    }),
  );
  await first.setViewportSize({ width: 390, height: 844 });
  await shot(first, 'invitacion-movil');
  check(
    'Invitation fits mobile width',
    await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await route(first, 'class');
  await shot(first, 'crear-reto-movil');
  check(
    'Builder fits mobile width',
    await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  const mobile = createChallenge({ mode: 'CON', difficulty: 'hard', seed: 'MOVIL1' });
  await start(first, mobile.code);
  await shot(first, 'reto-movil');
  check(
    'Seeded gameplay banner fits mobile width',
    await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  check('No console, runtime or network errors', errors.length === 0);
  await writeFile(
    `${screenshots}/report.json`,
    JSON.stringify({ checks: checks.length, errors, labels: checks }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length, errors, screenshots }));
} finally {
  await browser.close();
}
