import { activities } from '../../data/activities.js';
import { PLAY_FILTERS } from '../../domain/activity-preferences.js';

export const activityGroup = (id) =>
  ['order', 'matching', 'packet'].includes(id)
    ? 'hands-on'
    : ['adaptive', 'flashcards', 'exam'].includes(id)
      ? 'review'
      : 'situations';

export function filterCounts(summaries) {
  return Object.fromEntries(
    PLAY_FILTERS.map((filter) => [
      filter,
      activities.filter(
        (activity) =>
          filter === 'all' ||
          (filter === 'due'
            ? summaries[activity.id].pending > 0
            : activityGroup(activity.id) === filter),
      ).length,
    ]),
  );
}

export function bindPlayFilters(app) {
  function applyFilter(filter, remember = true) {
    if (filter === 'due' && !document.querySelector('[data-play-filter=due]')) filter = 'all';
    if (!PLAY_FILTERS.includes(filter)) filter = 'all';
    document
      .querySelectorAll('[data-play-filter]')
      .forEach((item) =>
        item.setAttribute('aria-pressed', String(item.dataset.playFilter === filter)),
      );
    let visible = 0;
    document.querySelectorAll('.activity-card').forEach((card) => {
      card.hidden =
        filter === 'due'
          ? Number(card.dataset.pending) <= 0
          : filter !== 'all' && card.dataset.activityGroup !== filter;
      if (!card.hidden) visible++;
    });
    document.querySelector('#activity-count').textContent =
      `${visible} ${visible === 1 ? 'actividad' : 'actividades'} ${filter === 'due' ? 'con repaso pendiente' : 'para elegir'}`;
    document.querySelector('#activity-empty').hidden = visible !== 0;
    if (remember) app?.repository.setPlayFilter(filter);
  }
  document
    .querySelectorAll('[data-play-filter]')
    .forEach((button) =>
      button.addEventListener('click', () => applyFilter(button.dataset.playFilter)),
    );
  document.querySelector('[data-play-filter-reset]').addEventListener('click', () => {
    applyFilter('all');
    document.querySelector('[data-play-filter="all"]').focus();
  });
  applyFilter(app?.repository.data.playFilter ?? 'all', false);
}
