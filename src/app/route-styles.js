const styles = typeof __STYLE_MAP__ === 'undefined' ? null : __STYLE_MAP__;
const loaded = new Map();
export function loadStyles(key) {
  if (!styles?.[key]) return Promise.resolve();
  return Promise.all([styles[key]].flat().map(loadStylesheet));
}
function loadStylesheet(path) {
  const href = new URL(path, document.baseURI).href;
  if (!loaded.has(href))
    loaded.set(
      href,
      new Promise((resolve, reject) => {
        // The bootstrap and lazy bundles may each import this loader. The DOM is
        // the shared owner, so a pending or loaded link is never appended twice.
        const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].find(
          (link) => link.href === href,
        );
        if (existing?.sheet) {
          resolve();
          return;
        }
        const link = existing ?? document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.addEventListener('load', () => resolve(), { once: true });
        link.addEventListener(
          'error',
          () => {
            loaded.delete(href);
            link.remove();
            reject(new Error('No se pudo cargar el estilo.'));
          },
          { once: true },
        );
        if (!existing) document.head.append(link);
      }),
    );
  return loaded.get(href);
}
