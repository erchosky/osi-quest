import { setHTML } from '../../components/dom-renderer.js';
import { storyChapters, storyById } from '../../data/story.js';
import { chapterUnlocked, unlockedActivities } from '../../domain/story-progress.js';
import { activities, activityById } from '../../data/activities.js';
import { html, escapeHtml, pageHeading, raw } from '../../components/html.js';
import { homeNetwork, networkDetail } from './network.js';

export function storyView(app, id) {
  const completed = app.repository.data.story.completed;
  const chapter = storyById.get(id);
  if (id && (!chapter || !chapterUnlocked(completed, id))) return lockedView(app, chapter);
  if (chapter) return chapterView(app, chapter);
  const next = storyChapters.find((item) => !completed.includes(item.id));
  const unlocked = unlockedActivities(completed);
  return {
    section: 'play',
    title: 'Historia · tu red de casa',
    html: html` ${raw(pageHeading('MODO HISTORIA', 'Construye tu red de casa.', 'Siete capítulos para construir tu red y entender cómo llega una web a tu casa.'))}
      <div class="story-overview">
        <div class="panel story-intro">
          <span class="badge badge-lime">${completed.length}/7 CAPÍTULOS</span>
          <h2>${next ? 'Tu siguiente conexión' : 'Tu casa ya está conectada.'}</h2>
          <p>
            ${raw(next ? escapeHtml(next.mission) : 'Has recorrido las siete funciones. Sigue practicando con las actividades desbloqueadas.')}
          </p>
          <a class="button button-primary" href="#/story/${next?.id ?? storyChapters[0].id}"
            >${completed.length ? 'Continuar la historia' : 'Entrar en mi casa'} →</a
          >
          <p class="small-note">
            Cada capítulo incluye una explicación y tres decisiones. Con dos aciertos, también con
            ayuda, construyes la pieza y desbloqueas sus actividades.
          </p>
        </div>
        ${raw(homeNetwork(completed))}
      </div>
      <div class="section-heading">
        <div>
          <p class="eyebrow">PASO A PASO</p>
          <h2>Tu historia, capítulo a capítulo.</h2>
        </div>
        <a class="text-link" href="#/play">Ver el modo libre →</a>
      </div>
      <div class="story-map-trail" aria-label="Recorrido de la historia">
        <span>⌂ Tu casa</span><span aria-hidden="true">→</span><span>Router y Wi-Fi</span
        ><span aria-hidden="true">→</span><span>☁ Internet</span>
      </div>
      <div class="story-chapters story-map" role="list" aria-label="Mapa de capítulos">
        ${raw(
          storyChapters
            .map((item, index) => {
              const open = chapterUnlocked(completed, item.id),
                done = completed.includes(item.id);
              return `<article role="listitem" class="panel story-chapter ${done ? 'is-complete' : ''} ${!open ? 'is-locked' : ''}"><div class="story-map-node"><span class="story-chapter-number">${String(index + 1).padStart(2, '0')}</span><span class="story-map-symbol" aria-hidden="true">${escapeHtml(item.symbol)}</span></div><span class="badge">${done ? '✓ Construido' : open ? 'Tu siguiente paso' : 'Por desbloquear'}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.mission)}</p><small>Desbloquea: ${item.unlocks.map((key) => escapeHtml(activityById.get(key).name)).join(' · ')}</small>${open ? `<a class="button button-secondary" href="#/story/${item.id}">${done ? 'Repasar capítulo' : 'Abrir capítulo'} →</a>` : '<p class="story-lock-note">Completa el capítulo anterior.</p>'}</article>`;
            })
            .join(''),
        )}
      </div>
      <section class="panel story-unlocks">
        <p class="eyebrow">TU CAJA DE HERRAMIENTAS</p>
        <h2>${unlocked.length} actividades desbloqueadas.</h2>
        <p class="subtle">
          Estos desbloqueos pertenecen a la historia. En el modo libre puedes elegir cualquier
          actividad.
        </p>
        <div class="story-unlock-list">
          ${raw(activities.map((item) => (unlocked.includes(item.id) ? `<a class="story-unlock is-unlocked" href="#/setup/${item.id}"><span>✓</span>${escapeHtml(item.name)}<span aria-hidden="true">→</span></a>` : `<div class="story-unlock"><span aria-hidden="true">○</span>${escapeHtml(item.name)}<small>Por desbloquear</small></div>`)).join(''))}
        </div>
      </section>`,
    bind() {
      document.querySelectorAll('[data-network-part]').forEach((button) =>
        button.addEventListener('click', () => {
          document
            .querySelectorAll('[data-network-part]')
            .forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
          setHTML(
            document.querySelector('#network-detail'),
            networkDetail(button.dataset.networkPart, completed),
          );
        }),
      );
    },
  };
}
function chapterView(app, chapter) {
  const completed = app.repository.data.story.completed,
    index = storyChapters.indexOf(chapter),
    done = completed.includes(chapter.id);
  return {
    section: 'play',
    title: `Historia · capítulo ${index + 1}`,
    html: html` <a class="text-link" href="#/story">← Ver mi casa</a>
      ${raw(pageHeading(`CAPÍTULO ${index + 1} DE 7`, chapter.title, chapter.mission))}
      <div class="story-lesson-layout">
        <section class="panel story-lesson">
          <span class="story-scene-symbol" aria-hidden="true">${chapter.symbol}</span>
          <h2>Lo que ocurre en tu casa</h2>
          <p>${raw(escapeHtml(chapter.scene))}</p>
          <h2>La idea que necesitas</h2>
          <p>${raw(escapeHtml(chapter.lesson))}</p>
          <div class="story-analogy">
            <strong>Llévalo al día a día</strong>
            <p>${raw(escapeHtml(chapter.analogy))}</p>
          </div>
          <div class="button-row">
            <button id="story-start" class="button button-primary">
              ${done ? 'Repasar las tres decisiones' : 'Construir esta parte de mi red'} →</button
            ><a class="button button-secondary" href="#/story">Volver al mapa</a>
          </div>
          <p class="small-note">
            ${done ? 'Este capítulo está construido. Su repaso no suma XP ni modifica tus estadísticas.' : 'Tres decisiones · normal guiado · pistas disponibles. Necesitas dos aciertos para construir la pieza.'}
          </p>
        </section>
        <aside class="panel story-chapter-aside">
          <p class="eyebrow">LA PIEZA QUE AÑADIRÁS</p>
          <h2>${raw(escapeHtml(chapter.part))}</h2>
          <p>${raw(escapeHtml(chapter.build))}</p>
          <h3>Actividades que desbloquea</h3>
          <ul>
            ${raw(chapter.unlocks.map((id) => `<li>${escapeHtml(activityById.get(id).name)}</li>`).join(''))}
          </ul>
          <p class="small-note">
            Puedes responder a tu ritmo. Si fallas, la explicación te ayuda a entender la decisión.
          </p>
        </aside>
      </div>`,
    bind() {
      document
        .querySelector('#story-start')
        .addEventListener('click', () => app.startStoryChapter(chapter.id));
    },
  };
}
function lockedView(app, chapter) {
  const next = storyChapters.find((item) => !app.repository.data.story.completed.includes(item.id));
  return {
    section: 'play',
    title: 'Capítulo por desbloquear',
    html: `<section class="panel empty-state"><p class="eyebrow">CADA PIEZA A SU TIEMPO</p><h1>${chapter ? 'Todavía falta el paso anterior.' : 'Este capítulo no existe.'}</h1><p>Tu siguiente capítulo es ${escapeHtml(next?.title ?? storyChapters[0].title)}.</p><a class="button button-primary" href="#/story/${next?.id ?? storyChapters[0].id}">Continuar mi historia →</a><a class="text-link" href="#/story">Ver mi casa</a></section>`,
  };
}
export { storyEntry } from './entry.js';
