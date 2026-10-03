import DOMPurify from '../vendor/dompurify.js';
// All parsing sinks enter here. Trusted Types adds browser enforcement; the
// sanitizer is also used by browsers without that API.
const clean = (markup) =>
  DOMPurify.sanitize(String(markup), {
    RETURN_TRUSTED_TYPE: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'style'],
    FORBID_ATTR: ['srcdoc'],
    ALLOW_DATA_ATTR: true,
  });
const policy =
  typeof window !== 'undefined' && window.trustedTypes
    ? window.trustedTypes.createPolicy('osi-quest', {
        createHTML: clean,
        createScriptURL: allowedWorkerURL,
      })
    : null;
export function setHTML(element, markup) {
  if (!element) return;
  element.innerHTML = policy ? policy.createHTML(String(markup)) : clean(markup);
}
export function appendHTML(element, markup) {
  if (!element) return;
  element.insertAdjacentHTML(
    'beforeend',
    policy ? policy.createHTML(String(markup)) : clean(markup),
  );
}

function allowedWorkerURL(value) {
  const url = new URL(value, document.baseURI);
  const source = new URL('../services/backup-worker.js', import.meta.url);
  const serviceWorker = new URL('./sw.js', document.baseURI);
  if (url.href === serviceWorker.href && url.origin === location.origin) return url.href;
  const base = new URL('.', document.baseURI);
  const suffix = url.href.slice(base.href.length);
  if (
    url.href !== source.href &&
    (!url.href.startsWith(base.href) || !/^assets\/backup-[A-Z0-9]+\.js$/.test(suffix))
  )
    throw new Error('Solo se permite el trabajador de copias de esta app.');
  return url.href;
}
export function backupWorkerURL(value) {
  const url = allowedWorkerURL(value);
  return policy ? policy.createScriptURL(url) : url;
}
