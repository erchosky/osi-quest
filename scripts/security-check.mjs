import { parse } from 'acorn';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
function walk(node, fn) {
  if (!node || typeof node !== 'object') return;
  fn(node);
  for (const [key, value] of Object.entries(node)) {
    if (['start', 'end'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((n) => walk(n, fn));
    else if (value?.type) walk(value, fn);
  }
}
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name),
      name = relative(root, path);
    if (entry.isDirectory()) {
      if (entry.name !== 'vendor') await check(path);
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    const ast = parse(await readFile(path, 'utf8'), {
      ecmaVersion: 'latest',
      sourceType: 'module',
    });
    walk(ast, (node) => {
      if (name === 'src/components/dom-renderer.js') return;
      if (node.type === 'MemberExpression') {
        const key =
          node.computed && node.property.type === 'Literal'
            ? node.property.value
            : !node.computed
              ? node.property.name
              : null;
        assert.ok(
          ![
            'innerHTML',
            'outerHTML',
            'insertAdjacentHTML',
            'createContextualFragment',
            'parseFromString',
            'write',
            'writeln',
          ].includes(key),
          `Parsing sink outside renderer: ${name}:${node.start}`,
        );
      }
    });
  }
}
await check(join(root, 'src'));
assert.equal(
  await readFile(join(root, 'src/vendor/dompurify.js'), 'utf8'),
  await readFile(join(root, 'node_modules/dompurify/dist/purify.es.mjs'), 'utf8'),
  'Update the vendored sanitizer together with its pinned package',
);
console.log('Renderizador único y versión del sanitizador comprobados.');
