import { storyChapters } from '../../data/story.js';
import { escapeHtml } from '../../components/html.js';
export function storyResult(session) {
  if (!session.storyChapter || session.kind !== 'story') return '';
  const chapter = session.storyChapter,
    next = storyChapters[storyChapters.indexOf(chapter) + 1];
  const passed = session.storyCompletion?.passed;
  return `<section class="panel story-result"><p class="eyebrow">TU RED DE CASA</p><h2>${session.practiceOnly ? 'Capítulo repasado.' : passed ? '¡Una pieza más construida!' : 'Vamos a reparar esta parte.'}</h2><p>${escapeHtml(passed || session.practiceOnly ? chapter.build : 'Necesitas dos decisiones acertadas de las tres. Vuelve al capítulo, repasa la explicación y prueba de nuevo.')}</p>${passed && !session.practiceOnly ? `<p>Desbloqueaste ${chapter.unlocks.length} actividades para seguir practicando.</p>` : ''}<div class="button-row"><a class="button button-primary" href="#/story/${passed && next ? next.id : chapter.id}">${passed && next ? 'Abrir el siguiente capítulo' : 'Volver al capítulo'} →</a><a class="button button-secondary" href="#/story">Ver mi red</a></div></section>`;
}
