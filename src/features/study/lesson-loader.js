import { lessons } from '../../data/lessons.js';
import { practicalLessons } from '../../data/practical-lessons.js';

const loaders = {
  1: () => import('../../data/layer-lessons/physical.js').then((m) => m.physicalLesson),
  2: () => import('../../data/layer-lessons/link.js').then((m) => m.linkLesson),
  3: () => import('../../data/layer-lessons/network.js').then((m) => m.networkLesson),
  4: () => import('../../data/layer-lessons/transport.js').then((m) => m.transportLesson),
  5: () => import('../../data/layer-lessons/session.js').then((m) => m.sessionLesson),
  6: () => import('../../data/layer-lessons/presentation.js').then((m) => m.presentationLesson),
  7: () => import('../../data/layer-lessons/application.js').then((m) => m.applicationLesson),
};
const loaded = new Map();
const pending = new Map();

export function cachedLesson(unit) {
  return unit.layer ? loaded.get(unit.layer) : (lessons[unit.id] ?? practicalLessons[unit.id]);
}

export function loadLessonContent(unit) {
  const cached = cachedLesson(unit);
  if (cached) return Promise.resolve(cached);
  if (!pending.has(unit.layer)) {
    const load = loaders[unit.layer];
    if (!load) return Promise.reject(new Error('Lección no disponible.'));
    pending.set(
      unit.layer,
      load().then(
        (content) => {
          loaded.set(unit.layer, content);
          pending.delete(unit.layer);
          return content;
        },
        (error) => {
          pending.delete(unit.layer);
          throw error;
        },
      ),
    );
  }
  return pending.get(unit.layer);
}
