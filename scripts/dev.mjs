import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, extname, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const root = await realpath(
  resolve(option('--root', fileURLToPath(new URL('../', import.meta.url)))),
);
const port = Number(option('--port', process.env.PORT || 5173));
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
};
const blocked = new Set(['tests', 'scripts', 'work', 'node_modules', 'docs']);
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
const inside = (path) => path === root || path.startsWith(root + sep);
const privatePath = (path) =>
  path.split(/[\\/]/).some((part) => part.startsWith('.') || blocked.has(part)) ||
  ['package.json', 'package-lock.json'].includes(basename(path));
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, headers);
    response.end();
    return;
  }
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const parts = path.split('/');
    if (privatePath(path)) throw new Error();
    let file = resolve(root, '.' + path);
    if (!inside(file)) throw new Error();
    file = await realpath(file);
    if (!inside(file)) throw new Error();
    if ((await stat(file)).isDirectory()) file = await realpath(resolve(file, 'index.html'));
    if (
      !inside(file) ||
      privatePath(relative(root, file)) ||
      !types[extname(file)] ||
      (extname(file) === '.json' && basename(file) !== 'version.json')
    )
      throw new Error();
    const contents = await readFile(file);
    response.writeHead(200, {
      ...headers,
      'Content-Type': `${types[extname(file)]}; charset=utf-8`,
    });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch {
    response.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Archivo no encontrado');
  }
});
server.on('error', (error) => {
  console.error(`No se pudo iniciar: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () =>
  console.log(`OSI Quest: http://127.0.0.1:${server.address().port}`),
);
