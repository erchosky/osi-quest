import { html } from './html.js';
import { safeLink } from '../services/links.js';

/** Authored references announce both the document language and the new tab. */
export function externalLink({ url, title, language }) {
  if (!['es', 'en'].includes(language)) throw new Error('Indica el idioma de la referencia.');
  return html`<a href="${safeLink(url)}" target="_blank" rel="noopener noreferrer"
    >${title} <span aria-hidden="true">↗</span>
    <span class="source-language">· ${language === 'es' ? 'Español' : 'Inglés'}</span>
    <span class="sr-only">; se abre en otra pestaña</span></a
  >`;
}
