import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';

// Each source stylesheet has one owner. Layers preserve the development cascade
// regardless of the order in which screens are visited in production.
export const styleOrder = [
  'tokens',
  'base',
  'shell',
  'components',
  'home',
  'study',
  'play',
  'choice',
  'explore',
  'progress',
  'rewards',
  'matching',
  'packet',
  'class',
  'learning',
  'round',
  'story',
  'responsive',
  'study-enhanced',
  'polish',
  'themes',
];
export const styleLayer = (name) => name.replaceAll('-', '_');
export const styleGroups = {
  core: [
    'tokens',
    'base',
    'shell',
    'components',
    'home',
    'rewards',
    'round',
    'story',
    'responsive',
    'polish',
    'themes',
  ],
  game: ['play', 'choice', 'learning'],
  study: ['study', 'study-enhanced'],
  explore: ['explore'],
  progress: ['progress'],
  class: ['class'],
  matching: ['matching'],
  packet: ['packet'],
};
export const styleDependencies = {
  home: ['core'],
  study: ['study'],
  play: ['game'],
  setup: ['game'],
  quiz: ['game', 'class'],
  order: ['game'],
  flashcards: ['game'],
  matching: ['game', 'matching'],
  packet: ['game', 'packet'],
  speedrun: ['game'],
  inspector: ['explore'],
  survival: ['game'],
  duel: ['game'],
  explore: ['explore'],
  lab: ['explore'],
  journey: ['explore'],
  glossary: ['explore'],
  progress: ['game', 'progress'],
  story: ['game'],
  class: ['game', 'class'],
};
export const lazyEntries = {
  study: 'features/study/view.js',
  play: 'features/play/view.js',
  setup: 'features/play/setup.js',
  quiz: 'features/quiz/view.js',
  order: 'features/order/view.js',
  flashcards: 'features/flashcards/view.js',
  matching: 'features/matching/view.js',
  packet: 'features/packet/view.js',
  speedrun: 'features/speedrun/view.js',
  inspector: 'features/inspector/view.js',
  survival: 'features/survival/view.js',
  duel: 'features/duel/view.js',
  explore: 'features/explore/view.js',
  lab: 'features/explore/lab.js',
  journey: 'features/explore/journey.js',
  glossary: 'features/explore/glossary.js',
  progress: 'features/progress/view.js',
  story: 'features/story/view.js',
  class: 'features/class/view.js',
  factory: 'features/play/session-factory.js',
};
export async function buildAssets(root, destination, { test, buildId }) {
  const common = {
    absWorkingDir: root,
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    metafile: true,
    legalComments: 'eof',
    outdir: resolve(destination, 'assets'),
    entryNames: '[name]-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
  };
  const worker = await build({
    ...common,
    entryPoints: { backup: 'src/services/backup-worker.js' },
  });
  const workerFile = Object.keys(worker.metafile.outputs).find((f) => f.endsWith('.js'));
  const workerURL =
    './assets/' +
    relative(resolve(destination, 'assets'), resolve(root, workerFile)).split('\\').join('/');
  const renderer = await build({
    ...common,
    entryPoints: { renderer: 'src/components/dom-renderer.js' },
  });
  const rendererFile = Object.keys(renderer.metafile.outputs).find((f) => f.endsWith('.js'));
  const rendererName = relative(resolve(destination, 'assets'), resolve(root, rendererFile))
    .split('\\')
    .join('/');
  const rendererPlugin = {
    name: 'one-renderer',
    setup(api) {
      api.onResolve({ filter: /dom-renderer\.js$/ }, () => ({
        path: 'osi-renderer/' + rendererName,
        external: true,
      }));
    },
  };
  const cssGroups = {};
  let outputs = { ...renderer.metafile.outputs, ...worker.metafile.outputs };
  for (const [key, files] of Object.entries(styleGroups)) {
    const input =
      `@layer ${styleOrder.map(styleLayer).join(',')};\n` +
      files.map((f) => `@import './${f}.css' layer(${styleLayer(f)});`).join('\n');
    const result = await build({
      ...common,
      stdin: {
        contents: input,
        resolveDir: resolve(root, 'src/styles'),
        sourcefile: `group-${key}.css`,
        loader: 'css',
      },
      entryNames: key + '-[hash]',
    });
    const path = Object.keys(result.metafile.outputs).find((f) => f.endsWith('.css'));
    cssGroups[key] =
      './assets/' +
      relative(resolve(destination, 'assets'), resolve(root, path)).split('\\').join('/');
    outputs = { ...outputs, ...result.metafile.outputs };
  }
  const cssPaths = Object.fromEntries(
    Object.entries(styleDependencies).map(([route, groups]) => [
      route,
      groups.map((group) => cssGroups[group]),
    ]),
  );
  const lazy = await build({
    ...common,
    entryPoints: Object.fromEntries(
      Object.entries(lazyEntries).map(([name, path]) => [name, 'src/' + path]),
    ),
    splitting: true,
    plugins: [rendererPlugin],
    define: {
      __BACKUP_WORKER__: JSON.stringify(workerURL),
      __DEV__: 'false',
      __TEST__: String(test),
      __BUILD_ID__: JSON.stringify(buildId),
      __STYLE_MAP__: JSON.stringify(cssPaths),
    },
  });
  const externals = new Map(
    Object.entries(lazy.metafile.outputs)
      .filter(([, info]) => info.entryPoint)
      .map(([path, info]) => [
        resolve(root, info.entryPoint),
        './' + relative(resolve(destination, 'assets'), resolve(root, path)).split('\\').join('/'),
      ]),
  );
  const lazyPlugin = {
    name: 'lazy-screens',
    setup(api) {
      api.onResolve({ filter: /\.js$/ }, (args) => {
        if (args.kind !== 'dynamic-import') return;
        const target = resolve(dirname(args.importer), args.path);
        if (externals.has(target)) return { path: externals.get(target), external: true };
      });
    },
  };
  const bootstrap = await build({
    ...common,
    entryPoints: { main: 'src/main.js' },
    plugins: [rendererPlugin, lazyPlugin],
    define: {
      __BACKUP_WORKER__: JSON.stringify(workerURL),
      __DEV__: 'false',
      __TEST__: String(test),
      __BUILD_ID__: JSON.stringify(buildId),
      __STYLE_MAP__: JSON.stringify(cssPaths),
    },
  });
  outputs = { ...outputs, ...lazy.metafile.outputs, ...bootstrap.metafile.outputs };
  // External imports can be emitted from entries and nested shared chunks.
  // Resolve the one sanitizer module relative to each emitted file, preserving
  // arbitrary GitHub Pages prefixes and never publishing host filesystem paths.
  const rendererAbsolute = resolve(destination, 'assets', rendererName);
  for (const file of Object.keys(outputs).filter((path) => path.endsWith('.js'))) {
    const absolute = resolve(root, file);
    let specifier = relative(dirname(absolute), rendererAbsolute).split('\\').join('/');
    if (!specifier.startsWith('.')) specifier = './' + specifier;
    const source = await readFile(absolute, 'utf8');
    await writeFile(
      absolute,
      source.replaceAll(JSON.stringify('osi-renderer/' + rendererName), JSON.stringify(specifier)),
    );
  }

  const main = Object.keys(bootstrap.metafile.outputs).find((f) => f.endsWith('.js'));
  return {
    outputs,
    main:
      './assets/' +
      relative(resolve(destination, 'assets'), resolve(root, main)).split('\\').join('/'),
    renderer: './assets/' + rendererName,
    css: cssGroups.core,
    styles: cssPaths,
    metafile: {
      inputs: {
        ...renderer.metafile.inputs,
        ...worker.metafile.inputs,
        ...lazy.metafile.inputs,
        ...bootstrap.metafile.inputs,
      },
      outputs,
    },
  };
}
