import { cp, mkdir, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { buildPWA } from './build-pwa.mjs';
import { buildReport } from './build-report.mjs';
import { buildAssets } from './build-assets.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const test = process.argv.includes('--test');
const destination = resolve(root, test ? 'dist-test' : 'dist');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const hash = createHash('sha256');
async function digest(dir) {
  for (const name of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (name.name === '.DS_Store') continue;
    const path = resolve(dir, name.name);
    if (name.isDirectory()) await digest(path);
    else {
      hash.update(name.name);
      hash.update(await readFile(path));
    }
  }
}
await digest(resolve(root, 'src'));
await digest(resolve(root, 'public'));
for (const file of [
  'index.html',
  'package.json',
  'scripts/build.mjs',
  'scripts/build-assets.mjs',
  'scripts/build-report.mjs',
  'scripts/build-pwa.mjs',
]) {
  hash.update(file);
  hash.update(await readFile(resolve(root, file)));
}
hash.update(String(test));
const buildId = hash.digest('hex').slice(0, 16);
const assets = await buildAssets(root, destination, { test, buildId });
const { outputs, main, renderer, css } = assets;
await buildReport(root, destination, assets);
const html = (await readFile(resolve(root, 'index.html'), 'utf8'))
  .replace('./src/main.js', main)
  .replace('./src/styles/index.css', css)
  .replace(
    '</head>',
    `<link rel="modulepreload" href="${renderer}" />\n<link rel="preload" as="style" href="${css}" fetchpriority="high" />\n</head>`,
  );
await writeFile(resolve(destination, 'index.html'), html);
await cp(resolve(root, 'public'), resolve(destination, 'public'), { recursive: true });
await cp(resolve(root, 'public/_headers'), resolve(destination, '_headers'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await writeFile(
  resolve(destination, 'version.json'),
  JSON.stringify({ version: pkg.version, buildId }),
);
await writeFile(resolve(destination, '.nojekyll'), '');
await buildPWA(destination, buildId);
const records = await Promise.all(
  Object.entries(outputs).map(async ([file]) => {
    const bytes = await readFile(resolve(root, file));
    return { file, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
  }),
);
console.log(
  JSON.stringify({
    directory: destination,
    test,
    files: records.length,
    totalGzipEstimate: records.reduce((sum, f) => sum + f.gzipBytes, 0),
    buildId,
  }),
);
