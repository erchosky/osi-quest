import { storyChapters } from '../../data/story.js';
import { escapeHtml } from '../../components/html.js';

export function homeNetwork(completed, selected = completed.at(-1) ?? 'cable') {
  return `<section class="panel home-network" aria-label="Tu red doméstica en construcción"><div class="network-roof" aria-hidden="true"><svg viewBox="0 0 600 70"><path d="M20 64 300 8 580 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></div><div class="network-heading"><span class="badge badge-lime">CASA CONECTADA</span><h2>Una pieza nueva con cada capítulo.</h2><p>Selecciona una pieza para recordar qué función aporta.</p></div><div class="network-parts">${storyChapters.map((chapter, index) => `<button class="network-part ${completed.includes(chapter.id) ? 'is-built' : ''}" data-network-part="${chapter.id}" aria-pressed="${chapter.id === selected}"><span class="network-symbol" aria-hidden="true">${chapter.symbol}</span><strong>${escapeHtml(chapter.part)}</strong><small>${completed.includes(chapter.id) ? '✓ Construida' : `Capítulo ${index + 1}`}</small></button>`).join('')}</div><div class="network-detail" id="network-detail" role="status">${networkDetail(selected, completed)}</div></section>`;
}
export function networkDetail(id, completed) {
  const chapter = storyChapters.find((item) => item.id === id) ?? storyChapters[0];
  return `<strong>${escapeHtml(chapter.part)}</strong><p>${escapeHtml(completed.includes(chapter.id) ? chapter.build : chapter.mission)}</p><span class="small-note">${completed.includes(chapter.id) ? 'Puedes volver al capítulo para repasarlo.' : 'Esta pieza se construirá al completar su capítulo.'}</span>`;
}
