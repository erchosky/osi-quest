import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.OSI_TEST_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.addInitScript(() => {
  const add = EventTarget.prototype.addEventListener,
    remove = EventTarget.prototype.removeEventListener;
  const entries = new Map();
  let next = 0;
  const ids = new WeakMap();
  const id = (object) => {
    if (!ids.has(object)) ids.set(object, ++next);
    return ids.get(object);
  };
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if ((this === window || this === document) && listener) {
      const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
      entries.set(`${id(this)}:${type}:${id(listener)}:${capture}`, {
        type,
        target: this === window ? 'window' : 'document',
      });
    }
    return add.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    if ((this === window || this === document) && listener) {
      const capture = typeof options === 'boolean' ? options : Boolean(options?.capture);
      entries.delete(`${id(this)}:${type}:${id(listener)}:${capture}`);
    }
    return remove.call(this, type, listener, options);
  };
  window.listenerSnapshot = () =>
    [...entries.values()].sort((a, b) => (a.target + a.type).localeCompare(b.target + b.type));
  Object.defineProperty(navigator, 'connection', { value: { saveData: true } });
});
try {
  await page.goto(base);
  await page.waitForSelector('.hero h1');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  const snapshot = async () => {
    await page.waitForTimeout(50);
    await cdp.send('HeapProfiler.collectGarbage');
    return {
      heap: (await cdp.send('Runtime.getHeapUsage')).usedSize,
      listeners: await page.evaluate(() => listenerSnapshot()),
      nodes: await page.locator('*').count(),
    };
  };
  const route = async (path, selector) => {
    await page.evaluate((path) => {
      location.hash = '/' + path;
    }, path);
    await page.waitForSelector(selector);
    await page.waitForFunction(() => !document.querySelector('#main').hasAttribute('aria-busy'));
  };
  const kinds = ['function', 'packet', 'matching', 'survival', 'order'];
  let warm;
  for (let index = 0; index < 100; index++) {
    await route('explore/glossary', '#glossary-search');
    await page.locator('#glossary-search').fill('tcp');
    // Leave before debounce expires; cleanup must cancel this pending update.
    await route('study/url', '#lesson-notes');
    await route('progress', '#export-progress');
    const kind = kinds[index % kinds.length];
    await route('setup/' + kind, '#setup-form');
    if (kind === 'survival') await page.locator('[name=timed]').check();
    await page.locator('#setup-form button[type=submit]').click();
    await page.waitForSelector('[data-round-close]');
    assert.ok(
      await page.evaluate(() => {
        const e = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(e);
        return e.defaultPrevented;
      }),
      'Active round guards unload',
    );
    if (kind === 'packet') await page.locator('[data-packet-token]').first().click();
    else if (kind === 'matching') await page.locator('[data-match-task]').first().click();
    else if (kind !== 'order') await page.locator('[data-choice]').first().click();
    await page.locator('[data-round-close]').click();
    await page.locator('[data-round-action=exit]').click();
    await page.waitForSelector('.activity-card');
    await route('home', '.hero h1');
    assert.ok(
      await page.evaluate(() => {
        const e = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(e);
        return !e.defaultPrevented;
      }),
      'Exit removes unload guard',
    );
    if (index === 19) warm = await snapshot();
  }
  const end = await snapshot();
  assert.deepEqual(
    end.listeners,
    warm.listeners,
    'Window/document listeners remain stable after warmed repeated navigation',
  );
  assert.ok(end.nodes <= warm.nodes + 10, 'DOM does not accumulate abandoned views');
  assert.ok(
    end.heap - warm.heap < 4 * 1024 * 1024,
    'Retained heap growth stays below 4 MiB over 80 additional cycles',
  );
  assert.deepEqual(errors, []);
  const report = {
    cycles: 100,
    rounds: 100,
    navigations: 600,
    warm,
    end,
    heapGrowth: end.heap - warm.heap,
    errors,
  };
  await mkdir(new URL('../work/browser-stability/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../work/browser-stability/report.json', import.meta.url),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
