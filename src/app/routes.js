import { homeView } from '../features/home/view.js';
import { loadStyles } from './route-styles.js';
// Cached screens render synchronously to preserve feedback and focus order.
const loaders = {
  study: () => import('../features/study/view.js').then((m) => m.studyView),
  play: () => import('../features/play/view.js').then((m) => m.playView),
  setup: () => import('../features/play/setup.js').then((m) => m.setupView),
  story: () => import('../features/story/view.js').then((m) => m.storyView),
  class: () => import('../features/class/view.js').then((m) => m.classView),
  quiz: () => import('../features/quiz/view.js').then((m) => m.quizView),
  order: () => import('../features/order/view.js').then((m) => m.orderView),
  flashcards: () => import('../features/flashcards/view.js').then((m) => m.flashcardsView),
  matching: () => import('../features/matching/view.js').then((m) => m.matchingView),
  packet: () => import('../features/packet/view.js').then((m) => m.packetView),
  speedrun: () => import('../features/speedrun/view.js').then((m) => m.speedrunView),
  inspector: () => import('../features/inspector/view.js').then((m) => m.inspectorView),
  survival: () => import('../features/survival/view.js').then((m) => m.survivalView),
  duel: () => import('../features/duel/view.js').then((m) => m.duelView),
  explore: () => import('../features/explore/view.js').then((m) => m.exploreView),
  lab: () => import('../features/explore/lab.js').then((m) => m.labView),
  journey: () => import('../features/explore/journey.js').then((m) => m.journeyView),
  glossary: () => import('../features/explore/glossary.js').then((m) => m.glossaryView),
  progress: () => import('../features/progress/view.js').then((m) => m.progressView),
};
const cached = new Map([['home', homeView]]);
const pending = new Map();
function loadScreen(key) {
  if (cached.has(key)) return Promise.resolve(cached.get(key));
  if (!pending.has(key))
    pending.set(
      key,
      Promise.all([loaders[key](), loadStyles(key)])
        .then(([view]) => {
          cached.set(key, view);
          pending.delete(key);
          return view;
        })
        .catch((error) => {
          pending.delete(key);
          throw error;
        }),
    );
  return pending.get(key);
}
function screen(key, app, ...args) {
  if (cached.has(key)) return cached.get(key)(app, ...args);
  return loadScreen(key).then((view) => view(app, ...args));
}
export function resolveView(app, [section, detail, anchor]) {
  if (['story', 'class', 'setup'].includes(section)) return screen(section, app, detail);
  if (section === 'study') return screen('study', app, detail, anchor);
  if (section === 'play')
    return screen(detail === 'run' && app.activity ? app.activity.type : 'play', app);
  if (section === 'explore')
    return screen(
      ['lab', 'journey', 'glossary', 'inspector'].includes(detail) ? detail : 'explore',
      app,
    );
  if (section === 'progress' || section === 'home') return screen(section, app);
  return {
    section: 'home',
    title: 'Página no encontrada',
    html: '<section class="panel empty-state"><h1>Por aquí no hay una capa.</h1><p>Vuelve al inicio para elegir tu siguiente paso.</p><a class="button button-primary" href="#/home">Ir al inicio →</a></section>',
  };
}

/** Share route promises and CSS cache with navigation; speculative errors remain retryable. */
export function prefetchScreen(key) {
  return loaders[key] ? loadScreen(key).catch(() => {}) : Promise.resolve();
}
