export function createRouter(render, { beforeNavigate = () => true } = {}) {
  let committed = location.hash;
  function read() {
    return parseRoute(location.hash);
  }
  function navigate(path) {
    if (location.hash === `#/${path}`) render(read(), true);
    else location.hash = `/${path}`;
  }
  window.addEventListener('hashchange', () => {
    const route = read();
    if (!beforeNavigate(route)) {
      history.replaceState(null, '', committed || '#/home');
      return;
    }
    committed = location.hash;
    render(route, true);
  });
  return {
    read,
    navigate,
    refresh: () => render(read(), false),
    start: () => render(read(), true),
  };
}

export function parseRoute(hash) {
  if (typeof hash !== 'string' || hash.length > 2048) return ['not-found'];
  const path = hash.replace(/^#\/?/, '').split('?')[0] || 'home';
  try {
    const parts = path.split('/');
    return parts.length > 4 ? ['not-found'] : parts.map((part) => decodeURIComponent(part));
  } catch {
    return ['not-found'];
  }
}
