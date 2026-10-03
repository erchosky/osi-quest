import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url)),
  dir = await mkdtemp(join(tmpdir(), 'osi-sw-update-'));
let server, b;
try {
  await cp(root + '/dist', join(dir, 'app'), { recursive: true });
  server = spawn(process.execPath, [root + '/scripts/dev.mjs', '--root', dir, '--port', '0'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const [line] = await once(server.stdout, 'data');
  const base = String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0] + '/app/';
  b = await chromium.launch();
  const c = await b.newContext();
  const p = await c.newPage();
  await p.goto(base);
  await p.waitForFunction(() => navigator.serviceWorker.controller);
  const p2 = await c.newPage();
  await p2.goto(base);
  await p2.waitForSelector('.hero');
  let source = await readFile(join(dir, 'app/sw.js'), 'utf8');
  source = source.replace(/const BUILD="[^"]+"/, 'const BUILD="update-fixture"');
  await writeFile(join(dir, 'app/sw.js'), source);
  await p.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg.update();
  });
  await p.waitForFunction(async () =>
    Boolean((await navigator.serviceWorker.getRegistration()).waiting),
  );
  await p.waitForSelector('.update-notice', { state: 'visible' });
  await p.locator('.update-notice button').click();
  await p.waitForFunction(() =>
    document.querySelector('#offline-status').textContent.includes('otras pestañas'),
  );
  assert.ok(await p.evaluate(() => navigator.serviceWorker.controller.state === 'activated'));
  assert.equal(await p2.locator('.hero').count(), 1);
  await p2.close();
  await Promise.all([
    p.waitForEvent('domcontentloaded'),
    p.locator('.update-notice button').click(),
  ]);
  await p.waitForFunction(async () => !(await navigator.serviceWorker.getRegistration()).waiting);
  await p.waitForSelector('.hero');
  assert.ok(
    await p.evaluate(async () => {
      const names = await caches.keys();
      return (
        names.some((n) => n.endsWith('update-fixture')) &&
        !names.some((n) => n.includes('/app/') && !n.endsWith('update-fixture'))
      );
    }),
  );
  // A failed update retains existing complete cache and the activated worker.
  await writeFile(
    join(dir, 'app/sw.js'),
    source
      .replace('update-fixture', 'broken-fixture')
      .replace('FILES=[', 'FILES=["./missing-required.css",'),
  );
  await p.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg.update();
  });
  await p.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !reg.installing && !(await caches.keys()).some(n => n.endsWith('broken-fixture'));
  });
  await c.setOffline(true);
  await p.reload();
  await p.waitForSelector('.hero');
  assert.ok(
    await p.evaluate(async () => !(await caches.keys()).some((n) => n.endsWith('broken-fixture'))),
  );
  console.log(
    JSON.stringify({
      checks: 6,
      updateBlockedForOtherTabs: true,
      updateAfterOtherTabsClose: true,
      previousCachesPruned: true,
      failedUpdateKeepsOfflineApp: true,
    }),
  );
} finally {
  await b?.close();
  server?.kill();
  await rm(dir, { recursive: true, force: true });
}
