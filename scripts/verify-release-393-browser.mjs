import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { questions } from '../src/data/questions/index.js';
import { flashcards } from '../src/data/flashcards.js';
import { createSession } from '../src/features/play/session-factory.js';
import { emptyProgress } from '../src/services/progress-schema.js';
import { sources } from '../src/data/sources.js';

const bankSize = createSession('speedrun', { difficulty: 'normal', seed: 'bank' }, emptyProgress())
  .bank.length;
const attemptCount = bankSize + 7;
const expectedXP = attemptCount * 8;
const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../work/browser-v393/', import.meta.url);
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['scripts/dev.mjs', '--root', 'dist', '--port', '0'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let browser;
const errors = [],
  checks = [];
const check = (label, value) => {
  assert.ok(value, label);
  checks.push(label);
};
try {
  const [line] = await once(server.stdout, 'data');
  const origin = String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`);
  });
  await page.clock.install();
  const visit = async (route, selector) => {
    await page.goto(`${origin}/#/${route}`);
    await page.locator(selector).waitFor();
    await page.waitForFunction(() => !document.querySelector('#main').hasAttribute('aria-busy'));
  };
  const question = async () => {
    const prompt = await page.locator('.question-title').innerText();
    const q = questions.find((q) => q.prompt === prompt);
    assert.ok(q, prompt);
    return q;
  };
  const start = async (mode) => {
    await visit(`setup/${mode}`, '#setup-form');
    await page.locator('input[name=difficulty][value=normal]').check();
    await page.locator('#setup-form button[type=submit]').click();
    await page.locator('[data-choice]').first().waitFor();
  };
  const axe = async (name) => {
    const result = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(
      result.violations.map((v) => v.id),
      [],
      name,
    );
    checks.push(`${name}: axe without violations`);
  };
  await start('survival');
  for (let i = 0; i < 3; i++) {
    const q = await question();
    const wrong = page.locator(`[data-choice]:not([data-choice="${q.correctIndex}"])`).first();
    await wrong.click();
    await page.locator('#next-question').click();
  }
  await page.locator('.result-hero').waitFor();
  const loss = await page.locator('.result-hero').innerText();
  check(
    'Three lost lives show SIN VIDAS and an honest loss heading',
    loss.includes('SIN VIDAS') && loss.includes('Te has quedado sin vidas'),
  );
  check(
    'Loss is not displayed as completed or decorated with a success medal',
    !loss.includes('RETO COMPLETADO') && (await page.locator('.result-medal').innerText()) === '♡',
  );
  check(
    'Loss retains exactly three attempts and retry action',
    loss.includes('0/3') && (await page.locator('#retry-mistakes').innerText()).includes('3'),
  );
  await axe('Survival loss');
  await page.screenshot({
    path: fileURLToPath(new URL('survival-loss.png', output)),
    fullPage: true,
  });
  await start('speedrun');
  for (let i = 0; i < attemptCount; i++) {
    await page.waitForFunction(
      (n) => document.querySelector('.game-toolbar .badge')?.textContent.includes(`RETO ${n}`),
      i + 1,
    );
    const q = await question();
    await page.locator(`[data-choice="${q.correctIndex}"]`).evaluate((b) => b.click());
    await page.locator('#next-question:not(:disabled)').waitFor();
    const label = await page.locator('#next-question').innerText();
    check(
      `Sprint attempt ${i + 1} advances without an artificial bank ending`,
      label.includes('Siguiente'),
    );
    await page.locator('#next-question').evaluate((b) => b.click());
  }
  await page.waitForFunction(
    (n) => document.querySelector('.game-toolbar .badge')?.textContent.includes(`RETO ${n}`),
    attemptCount + 1,
  );
  check(
    `Actual production Sprint remains playable beyond its ${bankSize}-question normal bank`,
    (await page.locator('[data-choice][aria-disabled="true"]').count()) === 0 &&
      (await page.locator('.result-hero').count()) === 0,
  );
  check(
    'Sprint HUD preserves all legitimate normal rewards across recycling',
    (await page.locator('.reward-hud').innerText()).includes(`${expectedXP} XP`),
  );
  check(
    'Sprint progress shows attempt count and at most eight recent dots',
    (await page.locator('.round-progress-caption').innerText()).includes(
      `${attemptCount} intentos`,
    ) && (await page.locator('.round-dot').count()) === 8,
  );
  await axe('Recycled Sprint');
  await page.screenshot({
    path: fileURLToPath(new URL('sprint-recycled.png', output)),
    fullPage: true,
  });
  await page.clock.fastForward(1000000);
  await page.locator('.result-hero').waitFor();
  const sprintResult = await page.locator('.result-hero').innerText();
  check(
    'Timer ends recycled Sprint with all attempts, XP and useful result heading',
    sprintResult.includes('TIEMPO AGOTADO') &&
      sprintResult.includes(`${attemptCount}/${attemptCount}`) &&
      sprintResult.includes(`+${expectedXP}`),
  );
  check(
    'Results retain all explained attempts across cycles',
    (await page.locator('.review-card').count()) === attemptCount,
  );
  await visit('setup/flashcards', '#setup-form');
  await page.locator('#setup-form button[type=submit]').click();
  const unitsSeen = new Set();
  for (let i = 0; i < flashcards.length; i++) {
    await page.locator('#reveal-card').waitFor();
    const front = await page.locator('.flashcard-panel h1').innerText();
    const expected = flashcards.find((c) => c.front === front);
    assert.ok(expected);
    await page.locator('#reveal-card').click();
    assert.equal(await page.locator('.flashcard-answer p').innerText(), expected.back);
    if (expected.id.startsWith('p-')) unitsSeen.add(expected.id);
    await page.locator('[data-rate=known]').click();
  }
  check(
    'All seven unit cards reveal their own unit explanation through the real game',
    unitsSeen.size === 7,
  );
  await visit('study/home-network', '.lesson');
  const home = await page.locator('.lesson').innerText();
  check(
    'Home lesson includes ChromeOS configuration and administrator-managed fields',
    home.includes('ChromeOS (Chromebook)') &&
      home.includes('servidores de nombres (DNS)') &&
      home.includes('administrador'),
  );
  check(
    'Home lesson explains Linux NetworkManager and a non-nmcli alternative',
    home.includes('nmcli device show') &&
      home.includes('IP4.GATEWAY') &&
      home.includes('ip route') &&
      home.includes('no los DNS'),
  );
  await visit('study/wifi', '.lesson');
  const wifi = await page.locator('.lesson').innerText();
  check(
    'Wi-Fi lesson includes 6 GHz, 6E/7 compatibility and regional limits',
    wifi.includes('6 GHz') &&
      wifi.includes('Wi-Fi 6E') &&
      wifi.includes('Wi-Fi 7') &&
      wifi.includes('depende del país'),
  );
  for (const [route, selector, expectedCount] of [
    ['explore/glossary', '.source-links', sources.length],
    ['explore/inspector', '#hex-bytes', 2],
  ]) {
    await visit(route, selector);
    const links = page.locator('#main a[target="_blank"]');
    assert.equal(await links.count(), expectedCount);
    for (let i = 0; i < expectedCount; i++) {
      const link = links.nth(i);
      const name = await link.ariaSnapshot();
      check(
        `${route} reference ${i + 1} announces language and new tab`,
        /Español|Inglés/.test(name) && name.includes('se abre en otra pestaña'),
      );
      assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
    }
    await axe(route);
    check(
      `${route} mobile does not overflow horizontally`,
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    );
    if (route.endsWith('glossary')) {
      check(
        'Spanish introductory references are available and the language mix is explained',
        (await page.locator('.source-language').filter({ hasText: 'Español' }).count()) >= 3 &&
          (await page.locator('.sources-panel').innerText()).includes(
            'referencias técnicas en inglés',
          ),
      );
      await page.locator('.sources-panel').screenshot({
        path: fileURLToPath(new URL('references-mobile.png', output)),
      });
      await context.route('https://**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<title>Referencia de prueba</title>',
        }),
      );
      const newTab = page.waitForEvent('popup');
      await links.first().click();
      const popup = await newTab;
      await popup.waitForLoadState();
      check(
        'Reference really opens a separate tab without an opener',
        popup.url() === sources[0].url && (await popup.evaluate(() => window.opener === null)),
      );
      await popup.close();
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(
    new URL('report.json', output),
    JSON.stringify({ production: true, checks: checks.length, names: checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ checks: checks.length, errors, output: fileURLToPath(output) }));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
