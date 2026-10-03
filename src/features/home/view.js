import { allowsPrefetch, idleTask } from '../../services/idle.js';
import { readInterface } from '../../services/interface-preferences.js';
import { storyChapters } from '../../data/progress-catalog.js';
import { storyEntry } from '../story/entry.js';
import { icon } from '../../components/icons.js';
import { html, routeLink, progressBar, raw } from '../../components/html.js';
import { units } from '../../data/units.js';
import { summarize, dueCount } from '../../domain/progress-metrics.js';
import { activities } from '../../data/activities.js';
import { questions } from '../../data/progress-catalog.js';

const modes = [
  [
    'study',
    '01',
    'study',
    'Entiende desde cero',
    'Estudia',
    'Una ruta guiada, ejemplos cotidianos y siete capas que por fin tienen sentido.',
    `${units.length} lecciones · a tu ritmo`,
  ],
  [
    'play',
    '02',
    'play',
    'Aprende haciendo',
    'Juega',
    'Elige tu reto. Ordena, resuelve casos o pon a prueba lo aprendido.',
    `Normal o difícil · ${activities.length} actividades`,
  ],
  [
    'explore',
    '03',
    'explore',
    'Conecta las ideas',
    'Explora',
    'Sigue un mensaje, abre sus envolturas y consulta lo que no te suene.',
    'Laboratorio · viaje · diccionario',
  ],
];

export function homeView(app) {
  const progress = app.repository.data;
  const next = units.find((unit) => !progress.read.includes(unit.id)) ?? units[0];
  const bookmark = progress.lessonBookmark;
  const resume = bookmark && units.find((unit) => unit.id === bookmark.unitId);
  const name = readInterface().name;
  const chapter = progress.story.completed.length
    ? storyChapters.find((item) => !progress.story.completed.includes(item.id))
    : null;
  const stats = summarize(progress.stats);
  const due = dueCount(questions, progress.stats, progress.difficulty);
  return {
    section: 'home',
    title: '',
    html: html`<p class="home-greeting" id="home-greeting">
        ${name ? `Hola, ${name} · ${due ? `${due} repasos pendientes` : 'vamos a conectar ideas'}` : 'Tu espacio para aprender redes.'}
      </p>
      <section class="hero">
        <div class="hero-copy">
          <span class="badge badge-lime">TU PRIMERA CONEXIÓN EMPIEZA AQUÍ</span>
          <h1>Entiende las redes.<br /><em>Capa a capa.</em></h1>
          <p>
            De «no tengo Internet» a entender qué pasa.<br />Estudia, experimenta y juega con el
            modelo OSI.
          </p>
          <div class="button-row">
            ${raw(
              routeLink(
                resume
                  ? `study/${resume.id}/${bookmark.sectionIndex}`
                  : chapter
                    ? `story/${chapter.id}`
                    : `study/${next.id}`,
                resume
                  ? 'Retomar la lectura →'
                  : chapter
                    ? 'Continuar mi historia →'
                    : progress.read.length
                      ? 'Continuar mi ruta →'
                      : 'Empezar desde cero →',
                'button button-primary',
              ),
            )}${raw(routeLink('play', 'Elegir un juego', 'button button-hero'))}
          </div>
          <div class="hero-caption">
            <span class="online-dot"></span>Sin prisa. Sin conocimientos previos.
          </div>
        </div>
        <div class="hero-art" aria-label="Las siete capas del modelo OSI">
          <canvas id="layer-canvas" width="460" height="360" aria-hidden="true"></canvas
          ><span class="art-label">7 CAPAS · UNA CONVERSACIÓN</span>
        </div>
      </section>
      ${raw(resume ? `<aside class="panel lesson-resume"><div><p class="eyebrow">DONDE LO DEJASTE</p><strong>${resume.title}</strong><p>Vuelve a la sección ${bookmark.sectionIndex + 1} de tu última lectura.</p></div><a class="button button-secondary" data-resume-lesson href="#/study/${resume.id}/${bookmark.sectionIndex}">Retomar la lectura →</a></aside>` : '')}
      ${raw(storyEntry(progress))}
      <div class="section-heading">
        <div>
          <p class="eyebrow">ELIGE TU CAMINO</p>
          <h2>¿Qué te apetece hacer?</h2>
        </div>
        <span class="subtle">Todo está conectado. Tú eliges por dónde empezar.</span>
      </div>
      <div class="mode-grid">
        ${raw(
          modes
            .map(
              ([route, number, symbol, eyebrow, name, description, foot]) =>
                html`<a class="mode-card mode-${route}" href="#/${route}"
                  ><div class="card-top">
                    <span class="mode-icon">${raw(icon(symbol))}</span
                    ><span class="mode-number">${number}</span>
                  </div>
                  <p class="eyebrow">${eyebrow}</p>
                  <h3>${name}<span>↗</span></h3>
                  <p>${description}</p>
                  <div class="card-footer">${foot}</div></a
                >`,
            )
            .join(''),
        )}
      </div>
      <div class="home-bottom">
        <section class="panel continue-panel">
          <div class="section-heading">
            <h2>Tu siguiente pequeño paso</h2>
            <span class="badge">${progress.read.length}/${units.length} lecciones</span>
          </div>
          <p class="subtle">${next.title} · ${next.description}</p>
          ${raw(progressBar((progress.read.length / units.length) * 100, 'Ruta completada'))}
          <div class="button-row">
            ${raw(routeLink(`study/${next.id}`, 'Abrir lección →'))}${raw(
              due ? routeLink('setup/adaptive', `Repasar ${due} pendientes`) : '',
            )}
          </div>
        </section>
        <a class="panel mini-progress" href="#/progress"
          ><p class="eyebrow">CADA INTENTO CUENTA</p>
          <strong>${stats.precision === null ? '—' : `${stats.precision}%`}</strong
          ><span>aciertos sin ayuda</span>
          <p>${stats.attempts} respuestas <b>↗</b></p></a
        >
      </div>`,
    bind() {
      let cancel = () => {};
      function preparePlay() {
        if (!allowsPrefetch()) return;
        cancel();
        cancel = idleTask(() => app.prefetchScreen('play'));
      }
      for (const link of document.querySelectorAll('#main a[href="#/play"]')) {
        link.addEventListener('pointerenter', preparePlay, { once: true });
        link.addEventListener('focus', preparePlay, { once: true });
      }
      return () => cancel();
    },
  };
}
