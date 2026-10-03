import { lazyEntries } from './build-assets.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
export async function buildReport(root, destination, assets) {
  const files = await Promise.all(
    Object.entries(assets.outputs).map(async ([path, metadata]) => {
      const bytes = await readFile(resolve(root, path));
      return {
        path: './' + relative(destination, resolve(root, path)).split('\\').join('/'),
        bytes: bytes.length,
        gzipBytes: gzipSync(bytes).length,
        metadata,
      };
    }),
  );
  const byPath = new Map(files.map((file) => [file.path, file]));
  function dependencies(start) {
    const found = new Set();
    function visit(path) {
      if (found.has(path) || !byPath.has(path)) return;
      found.add(path);
      for (const imported of byPath.get(path).metadata.imports ?? []) {
        if (imported.kind === 'dynamic-import' || imported.external) continue;
        visit('./' + relative(destination, resolve(root, imported.path)).split('\\').join('/'));
      }
    }
    for (const path of start) visit(path);
    return [...found];
  }
  const startup = dependencies([assets.main, assets.renderer, assets.css]);
  const startupSet = new Set(startup);
  const gzip = (paths) => paths.reduce((sum, path) => sum + (byPath.get(path)?.gzipBytes ?? 0), 0);
  assert.ok(gzip(startup) < 55 * 1024, 'Initial assets exceed the 55 KiB gzip budget');
  const screens = Object.fromEntries(
    Object.entries(assets.styles)
      .filter(([name]) => name !== 'home')
      .map(([name, styles]) => {
        const entry = files.find((file) => file.metadata.entryPoint === `src/${lazyEntries[name]}`);
        assert.ok(entry, `Missing built entry for ${name}`);
        const paths = dependencies([entry?.path, ...styles]).filter(
          (path) => !startupSet.has(path),
        );
        const bytes = gzip(paths);
        const budget = (name === 'play' ? 30 : name === 'study' ? 32 : 40) * 1024;
        assert.ok(bytes < budget, `${name} exceeds its incremental gzip budget`);
        return [name, { gzipBytes: bytes, budget, files: paths }];
      }),
  );
  const report = {
    description:
      'Estimated gzip bytes for a cold load. Each screen budget counts its static imports and CSS beyond startup; speculative prefetch is measured by browser tests.',
    startup: { gzipBytes: gzip(startup), budget: 55 * 1024, files: startup },
    screens,
    files: files.map(({ metadata, ...file }) => file),
    largestInputs: Object.entries(assets.metafile.inputs)
      .sort((a, b) => b[1].bytes - a[1].bytes)
      .slice(0, 25)
      .map(([path, info]) => ({ path, bytes: info.bytes })),
    metafile: assets.metafile,
  };
  await mkdir(resolve(root, 'work/build'), { recursive: true });
  await writeFile(
    resolve(
      root,
      relative(root, destination) === 'dist-test'
        ? 'work/build/report-test.json'
        : 'work/build/report.json',
    ),
    JSON.stringify(report, null, 2),
  );
  return report;
}
