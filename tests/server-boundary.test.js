import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
test('Preview canonical paths cannot escape through files, directories or encoded symlinks; web assets still work', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'osi-boundary-')),
    root = join(directory, 'site');
  await mkdir(root);
  await mkdir(join(root, 'tests'));
  await writeFile(join(root, 'index.html'), '<h1>Welcome</h1>');
  await writeFile(join(root, 'site.js'), 'export const ok=true;');
  await writeFile(join(root, 'package.json'), 'private');
  await writeFile(join(root, 'tests', 'private.js'), 'private');
  await symlink(join(root, 'tests'), join(root, 'alias'));
  const outside = join(directory, 'private.html');
  await writeFile(outside, 'private');
  await symlink(outside, join(root, 'escape.html'));
  await symlink(directory, join(root, 'escape-directory'));
  await mkdir(join(root, 'landing'));
  await symlink(outside, join(root, 'landing', 'index.html'));
  const server = spawn(process.execPath, ['scripts/dev.mjs', '--root', root, '--port', '0'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const [data] = await once(server.stdout, 'data');
    const base = String(data).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
    for (const path of [
      '/alias/private.js',
      '/escape.html',
      '/%65scape.html',
      '/escape-directory/private.html',
      '/landing/',
      '/package.json',
      '/tests/private.js',
      '/%74ests/private.js',
      '/%2e%2e/private.html',
    ]) {
      for (const method of ['GET', 'HEAD'])
        assert.equal((await fetch(base + path, { method })).status, 404, path + ' ' + method);
    }
    for (const path of ['/', '/site.js']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    }
    assert.equal((await fetch(base + '/site.js', { method: 'POST' })).status, 405);
  } finally {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
    await rm(directory, { recursive: true, force: true });
  }
});
