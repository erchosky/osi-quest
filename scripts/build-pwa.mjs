import { readdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
export async function buildPWA(destination, buildId) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (!['_headers', '.nojekyll', 'version.json', 'sw.js'].includes(entry.name))
        files.push('./' + relative(destination, path).split('\\').join('/'));
    }
  }
  await walk(destination);
  const template = await readFile(new URL('../src/service-worker.js', import.meta.url), 'utf8');
  const source = template
    .replace('__PWA_BUILD__', JSON.stringify(buildId))
    .replace('__PWA_FILES__', JSON.stringify(files.sort()));
  await writeFile(resolve(destination, 'sw.js'), source);
  return files.length;
}
