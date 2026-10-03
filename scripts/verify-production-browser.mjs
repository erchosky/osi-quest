import assert from 'node:assert/strict';
import { cp, mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { serializeProgress } from '../src/services/progress-integrity.js';
import { emptyProgress } from '../src/services/progress-schema.js';
const root = fileURLToPath(new URL('../', import.meta.url)),
  directory = await mkdtemp(join(tmpdir(), 'osi-release-'));
let preview,
  browser,
  checks = 0;
const errors = [],
  requests = [],
  pending = [];
const check = (label, value) => {
  assert.ok(value, label);
  checks++;
};
try {
  await cp(join(root, 'dist'), join(directory, 'mi-repositorio'), { recursive: true });
  preview = spawn(
    process.execPath,
    [join(root, 'scripts/dev.mjs'), '--root', directory, '--port', '0'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const [line] = await once(preview.stdout, 'data');
  const base = String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0] + '/mi-repositorio/';
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    if (/\.(js|css)$/.test(response.url()))
      pending.push(
        response
          .body()
          .then((body) =>
            requests.push({ url: response.url(), bytes: body.length, gzip: gzipSync(body).length }),
          ),
      );
  });
  await page.coverage.startCSSCoverage({ resetOnNavigation: false });
  await page.goto(base);
  await page.waitForSelector('.hero h1');
  await page.waitForLoadState('networkidle');
  await Promise.all(pending);
  const home = requests.slice();
  check(
    'Production contains no test hooks or diagnostics',
    await page.evaluate(
      () =>
        typeof window.render_game_to_text === 'undefined' &&
        typeof window.advanceTime === 'undefined' &&
        !document.querySelector('.development-panel'),
    ),
  );
  check('Initial JS/CSS uses at most three requests', home.length <= 3);
  check(
    'Initial compressed asset estimate is below 55 KiB',
    home.reduce((s, r) => s + r.gzip, 0) < 55 * 1024,
  );
  check(
    'All assets work under repository prefix',
    home.every((r) => r.url.startsWith(base + 'assets/')),
  );
  async function route(path, selector) {
    await page.evaluate((path) => {
      location.hash = '/' + path;
    }, path);
    await page.waitForSelector(selector);
    await page.waitForFunction(() => !document.querySelector('#main').hasAttribute('aria-busy'));
  }
  for (const [path, selector] of [
    ['study/url/1', '#lesson-section-1'],
    ['explore/lab', '#wrap'],
    ['explore/journey', '.journey-panel'],
    ['explore/glossary', '#glossary-search'],
    ['story', '.story-chapters'],
    ['progress', '#export-progress'],
    ['class', '#class-create'],
    ['play', '.activity-card'],
  ]) {
    await route(path, selector);
    check('Deferred screen renders ' + path, (await page.locator(selector).count()) > 0);
  }
  await route('class', '#class-create');
  await page.locator('#class-create button[type=submit]').click();
  await page.waitForSelector('#class-code');
  check(
    'Shared challenge links preserve prefix',
    (await page.locator('#class-link').inputValue()).startsWith(base),
  );
  await route('setup/function', '#setup-form');
  await page.locator('input[value=hard]').check();
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForSelector('[data-choice]');
  check(
    'Game choices remain interactive in production',
    (await page.locator('[data-choice]').count()) === 4,
  );
  await page.locator('[data-choice]').first().click();
  await page.waitForSelector('[data-revealed-layer]');
  check(
    'Revealed answer explains its layer',
    await page
      .locator('#question-feedback')
      .innerText()
      .then((text) => text.includes('Capa')),
  );
  await page.locator('[data-round-close]').click();
  await page.locator('[data-round-action=exit]').click();
  await page.waitForSelector('.activity-card');
  check(
    'Unload warning is removed after exit',
    await page.evaluate(() => {
      const e = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(e);
      return !e.defaultPrevented;
    }),
  );
  await route('progress', '#import-progress');
  await page.locator('#import-progress').setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(serializeProgress({ ...emptyProgress(), xp: 321 })),
  });
  await page.waitForSelector('[data-dialog=confirm]');
  await page.locator('[data-dialog=confirm]').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('osi-quest-v1')).xp === 321);
  check('Production backup worker validates and imports progress', true);
  await page.route('**/version.json', (route) =>
    route.fulfill({ json: { version: 'next', buildId: 'new-version' } }),
  );
  // Respect the one-minute update throttle after the new startup check.
  await page.clock.install();
  await page.clock.runFor(61000);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForSelector('.update-notice:not([hidden])');
  check(
    'New-version prompt appears without interrupting play',
    (await page.locator('.update-notice button').innerText()) === 'Actualizar la app',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await route('setup/packet', '#setup-form');
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForSelector('[data-packet-token]');
  const unchanged = await page.evaluate(() => {
    window.originalPacket = document.querySelector('.packet-token');
    return true;
  });
  await page.locator('[data-packet-token]').first().click();
  check(
    'Selection preserves mounted controls',
    unchanged &&
      (await page.evaluate(
        () => window.originalPacket === document.querySelector('.packet-token'),
      )),
  );
  check(
    'Mobile fits viewport',
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  );
  await page.locator('[data-round-close]').click();
  await page.locator('[data-round-action=exit]').click();
  await page.waitForSelector('.activity-card');
  const coverage = await page.coverage.stopCSSCoverage();
  const report = coverage.map((file) => ({
    url: file.url,
    totalBytes: file.text.length,
    usedBytes: file.ranges.reduce((sum, r) => sum + r.end - r.start, 0),
  }));
  await mkdir(join(root, 'work/browser-production'), { recursive: true });
  await writeFile(
    join(root, 'work/browser-production/css-coverage.json'),
    JSON.stringify(report, null, 2),
  );
  check('Ordinary production flows have no runtime/HTTP/CSP errors', errors.length === 0);
  // Attack probes run in a separate page: browser rejection intentionally emits a console violation.
  const attack = await browser.newPage();
  await attack.goto(base);
  await attack.waitForSelector('.hero h1');
  check(
    'Chromium rejects direct untrusted HTML',
    await attack.evaluate(() => {
      try {
        document.querySelector('#main').innerHTML = '<img onerror="alert(1)">';
        return false;
      } catch (error) {
        return error instanceof TypeError;
      }
    }),
  );
  const rendererURL = home.find((resource) => /renderer-[A-Z0-9]+\.js$/.test(resource.url)).url;
  const rendererProof = await attack.evaluate(async (url) => {
    const { setHTML, backupWorkerURL } = await import(url);
    const element = document.createElement('div');
    setHTML(
      element,
      '<strong>Texto legítimo</strong><svg><script>window.injected=1</script></svg><a href="javascript:alert(1)" onclick="window.injected=1">Enlace</a>',
    );
    let workerRejected = false;
    try {
      backupWorkerURL('https://example.org/evil.js');
    } catch {
      workerRejected = true;
    }
    return {
      clean:
        !element.querySelector('script,[onclick],[href^="javascript:"]') &&
        element.querySelector('strong').textContent === 'Texto legítimo',
      workerRejected,
    };
  }, rendererURL);
  check(
    'Renderer strips executable markup while preserving legitimate content',
    rendererProof.clean,
  );
  check('Trusted Types worker policy rejects arbitrary script URLs', rendererProof.workerRejected);
  const corrupt = await browser.newPage();
  await corrupt.addInitScript(() => localStorage.setItem('osi-quest-v1', ''));
  await corrupt.goto(base);
  await corrupt.waitForSelector('#save-original-progress');
  await corrupt.evaluate(() => {
    location.hash = '/setup/function';
  });
  await corrupt.waitForSelector('#setup-form');
  await corrupt.locator('#setup-form button[type=submit]').click();
  await corrupt.waitForSelector('[data-choice]');
  await corrupt.locator('[data-choice]').first().click();
  check(
    'Even zero-byte corrupt progress survives live gameplay',
    await corrupt.evaluate(() => localStorage.getItem('osi-quest-v1') === ''),
  );
  const download = corrupt.waitForEvent('download');
  await corrupt.locator('#save-original-progress').click();
  check(
    'Original can be downloaded',
    (await download).suggestedFilename() === 'osi-quest-original-no-modificado.txt',
  );
  console.log(
    JSON.stringify({
      passed: checks,
      initialRequests: home.length,
      initialBytes: home.reduce((s, r) => s + r.bytes, 0),
      initialGzipEstimate: home.reduce((s, r) => s + r.gzip, 0),
      errors,
      cssCoverage: report.length,
    }),
  );
} finally {
  await browser?.close();
  if (preview) {
    const exited = once(preview, 'exit');
    preview.kill();
    await exited;
  }
  await rm(directory, { recursive: true, force: true });
}
