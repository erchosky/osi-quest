import { storyChapters } from '../../data/progress-catalog.js';
import { escapeHtml } from '../../components/html.js';
export function storyEntry(progress) {
  const completed = progress.story.completed,
    next = storyChapters.find((chapter) => !completed.includes(chapter.id));
  return `<section class="story-entry"><div class="story-entry-symbol" aria-hidden="true">⌂</div><div><p class="eyebrow">MODO HISTORIA · ${completed.length}/7 CAPÍTULOS</p><h2>Tu casa empieza con una conexión.</h2><p>${next ? escapeHtml(next.mission) : 'Tu red está construida. Vuelve para explorar sus piezas y practicar.'}</p></div><a href="#/story" class="button button-secondary">${completed.length ? 'Volver a mi historia' : 'Construir mi red'} →</a></section>`;
}
