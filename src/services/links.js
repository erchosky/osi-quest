/** Authored links may use HTTPS, hash routes or this app's own HTTP dev origin. */
export function safeLink(
  value,
  base = typeof location === 'undefined' ? 'https://osi.invalid/' : location.href,
) {
  const text = String(value ?? '');
  if (text.startsWith('#/')) return text;
  try {
    const url = new URL(text, base),
      origin = new URL(base).origin;
    if (url.protocol === 'https:' || (url.protocol === 'http:' && url.origin === origin))
      return url.href;
  } catch {}
  throw new Error('El enlace no utiliza una dirección permitida.');
}
