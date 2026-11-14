import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const output = resolve(
  process.argv[2] ??
    resolve(root, '..', `osi-quest-github-v${pkg.version.replace(/\.0$/, '')}.zip`),
);
const included = ['src', 'public', 'scripts', 'tests', 'docs', '.github', 'dist'];
const rootFiles = [
  'index.html',
  'package.json',
  'package-lock.json',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'LICENSE',
  'THIRD-PARTY-NOTICES.md',
  '.gitignore',
  '.editorconfig',
  '.prettierrc.json',
  '.prettierignore',
];
const files = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    if (entry.isSymbolicLink()) throw new Error('Release cannot include symlinks');
    if (/ \d+(?:\.[^.]*)?$/.test(entry.name)) throw new Error(`Duplicate filename: ${entry.name}`);
    const file = resolve(path, entry.name);
    if (entry.isDirectory()) await walk(file);
    else files.push(relative(root, file));
  }
}
for (const folder of included) await walk(resolve(root, folder));
for (const file of rootFiles) {
  await stat(resolve(root, file));
  files.push(file);
}
const version = JSON.parse(await readFile(resolve(root, 'dist/version.json'), 'utf8'));
if (version.version !== pkg.version) throw new Error('Build version does not match source');
const manifest = await Promise.all(
  files.sort().map(async (path) => ({
    path,
    sha256: createHash('sha256')
      .update(await readFile(resolve(root, path)))
      .digest('hex'),
  })),
);
await mkdir(resolve(root, 'work/release'), { recursive: true });
const manifestPath = resolve(root, 'work/release/manifest.json');
await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
const result = spawnSync(
  'python3',
  [
    '-c',
    `
import zipfile,json,pathlib,sys,hashlib
root=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);manifest=json.loads(pathlib.Path(sys.argv[3]).read_text())
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for item in manifest:
  data=(root/item['path']).read_bytes()
  if hashlib.sha256(data).hexdigest()!=item['sha256']:raise RuntimeError('File changed during release')
  z.writestr('osi-quest/'+item['path'],data)
 z.writestr('osi-quest/RELEASE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(out) as z:
 if z.testzip():raise RuntimeError('Corrupt ZIP')
 if len(z.namelist())!=len(set(z.namelist())):raise RuntimeError('Duplicate ZIP entry')
 for item in manifest:
  if hashlib.sha256(z.read('osi-quest/'+item['path'])).hexdigest()!=item['sha256']:raise RuntimeError('ZIP manifest mismatch')
`,
    root,
    output,
    manifestPath,
  ],
  { encoding: 'utf8' },
);
if (result.status !== 0) throw new Error(result.stderr || 'Packaging failed');
const sha = createHash('sha256')
  .update(await readFile(output))
  .digest('hex');
await writeFile(output + '.sha256', sha + '  ' + basename(output) + '\n');
console.log(JSON.stringify({ output, files: files.length, sha256: sha, buildId: version.buildId }));
