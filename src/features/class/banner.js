import { html, escapeHtml, raw } from '../../components/html.js';

export function challengeBanner(challenge) {
  return html`<aside class="class-round">
    <div>
      <strong>Reto de clase</strong
      ><span>${raw(escapeHtml(challenge.seed))} · ${raw(escapeHtml(challenge.code))}</span>
    </div>
    <a class="text-link" href="#/class/${challenge.code}">Ver y compartir el reto →</a>
  </aside>`;
}
