import { storyChapters } from '../../data/progress-catalog.js';
import { chapterUnlocked } from '../../domain/story-progress.js';
import { activityPreviews } from '../../data/activity-previews.js';
import { allowsPrefetch, idleTask } from '../../services/idle.js';
import { activities } from '../../data/activities.js';
import { icon } from '../../components/icons.js';
import { html, pageHeading, escapeHtml, raw } from '../../components/html.js';
import { bindPlayFilters, activityGroup, filterCounts } from './filters.js';
import {
  activitySummary,
  optionSummary,
  recommendedActivity,
} from '../../domain/activity-preferences.js';

const activityPriority = [
  'order',
  'function',
  'matching',
  'packet',
  'scenario',
  'protocol',
  'cases',
  'flashcards',
  'adaptive',
  'confusions',
  'focus',
  'speedrun',
  'survival',
  'duel',
  'exam',
];
const orderedActivities = activityPriority.map((id) =>
  activities.find((activity) => activity.id === id),
);

function startLabel(kind, options) {
  if (kind === 'flashcards') return 'Abrir tarjetas';
  if (kind === 'cases') return 'Abrir caso';
  if (kind === 'confusions') return 'Comprobar conceptos';
  const direction =
    kind === 'order' ? ` · ${options.direction === 'send' ? 'Envío' : 'Recepción'}` : '';
  const timed = kind === 'survival' ? ` · ${options.timed ? '30 s' : 'Sin reloj'}` : '';
  return `Jugar · ${options.difficulty === 'hard' ? 'Difícil' : 'Normal'}${direction}${timed}`;
}

function activityCard(activity, summary) {
  const configuration = optionSummary(activity.id, summary.options);
  return html`<article
    class="activity-card panel ${activity.interactive ? 'activity-interactive' : ''}"
    data-activity-group="${activityGroup(activity.id)}"
    data-pending="${summary.pending}"
  >
    <div class="card-top">
      <span class="activity-icon">${raw(icon(activity.icon))}</span>
      <span class="badge ${summary.pending ? 'badge-peach' : ''}"
        >${summary.pending ? `${summary.pending} por repasar` : activity.tag}</span
      >
    </div>
    <h2>${activity.name}</h2>
    <p class="activity-description">${activity.description}</p>
    <details class="activity-details">
      <summary>Cómo se juega y tus resultados</summary>
      <ol class="activity-preview" aria-label="Tres pasos para jugar">
        ${raw(
          activityPreviews[activity.id]
            .map((step, i) => html`<li><span aria-hidden="true">${i + 1}</span>${step}</li>`)
            .join(''),
        )}
      </ol>
      <div class="activity-history" aria-label="Resultados de esta configuración">
        <span
          ><strong>Mejor reciente</strong> ${summary.best
            ? `${summary.best.correct}/${summary.best.total}`
            : 'Por estrenar'}</span
        >
        <span
          ><strong>Última</strong> ${summary.latest
            ? `${summary.latest.correct}/${summary.latest.total}`
            : 'Sin ronda completada'}</span
        >
      </div>
      ${raw(
        summary.unseenCards
          ? `<span class="small-note">${summary.unseenCards} tarjetas nuevas por descubrir</span>`
          : '',
      )}
      <div class="activity-configuration">
        <span>${summary.remembered ? 'Como la última vez' : 'Listo para empezar'}</span>
        <strong>${raw(escapeHtml(configuration))}</strong>
      </div>
    </details>
    <div class="activity-actions">
      <button
        class="button button-secondary"
        data-quickstart="${activity.id}"
        aria-label="${raw(
          escapeHtml(
            `${summary.remembered ? 'Jugar como la última vez' : 'Jugar ahora'}: ${activity.name}. ${configuration}`,
          ),
        )}"
      >
        ${startLabel(activity.id, summary.options)} →
      </button>
      <a class="text-link" href="#/setup/${activity.id}" aria-label="Configurar ${activity.name}"
        >Configurar</a
      >
    </div>
    <span class="activity-length">${activity.length}</span>
  </article>`;
}

export function playView(app) {
  const progress = app?.repository.data ?? { difficulty: 'normal' };
  const summaries = Object.fromEntries(
    activities.map(({ id }) => [id, activitySummary(progress, id)]),
  );
  const counts = filterCounts(summaries);
  const recommendation = recommendedActivity(progress);
  const suggested = activities.find((activity) => activity.id === recommendation.kind);
  return {
    section: 'play',
    title: '',
    html: html`${raw(
        pageHeading(
          'TU PATIO DE PRÁCTICAS',
          'Elige cómo quieres jugar.',
          'Practica a tu ritmo. Elige una actividad o continúa donde lo dejaste.',
        ),
      )}
      <div class="choice-recommendation panel">
        <div>
          <p class="eyebrow">HOY TE RECOMIENDO</p>
          <h2>${suggested.name}</h2>
          <p>${recommendation.reason}</p>
        </div>
        <button
          class="button button-primary"
          data-quickstart="${suggested.id}"
          aria-label="Empezar recomendado: ${suggested.name}"
        >
          Empezar →
        </button>
      </div>
      <div class="play-shortcuts">
        <details class="chapter-picker">
          <summary>⌂ Mi historia · ${progress.story?.completed?.length ?? 0}/7 capítulos</summary>
          <nav aria-label="Elegir capítulo">
            ${raw(
              storyChapters
                .map((chapter, index) => {
                  const completed = progress.story?.completed ?? [];
                  return chapterUnlocked(completed, chapter.id)
                    ? html`<a href="#/story/${chapter.id}"
                        ><span>${index + 1}</span>${chapter.title}<small
                          >${completed.includes(chapter.id) ? '✓ Construido' : 'Disponible'}</small
                        ></a
                      >`
                    : html`<span class="locked-chapter"
                        >${index + 1}. ${chapter.title}<small>Completa el anterior</small></span
                      >`;
                })
                .join(''),
            )}
          </nav>
        </details>
        <span class="class-entry"><a class="text-link" href="#/class">Reto de clase →</a></span>
      </div>
      <div class="activity-filters" aria-label="Tipo de actividad">
        <button data-play-filter="all" aria-pressed="true">Todas <span>${counts.all}</span></button>
        <button data-play-filter="hands-on" aria-pressed="false">
          Manipular <span>${counts['hands-on']}</span>
        </button>
        <button data-play-filter="situations" aria-pressed="false">
          Resolver <span>${counts.situations}</span>
        </button>
        <button data-play-filter="review" aria-pressed="false">
          Recordar <span>${counts.review}</span>
        </button>
        ${raw(
          counts.due
            ? html`<button data-play-filter="due" aria-pressed="false">
                Repaso pendiente <span>${counts.due}</span>
              </button>`
            : '',
        )}
      </div>
      <p class="small-note" id="activity-count" role="status">
        ${activities.length} actividades para elegir
      </p>
      <div class="activity-grid">
        ${raw(
          orderedActivities
            .map((activity) => activityCard(activity, summaries[activity.id]))
            .join(''),
        )}
      </div>
      <div class="choice-empty panel" id="activity-empty" hidden>
        <h2>No tienes repasos pendientes.</h2>
        <p>
          Los errores y las tarjetas ya estudiadas aparecerán aquí cuando toque recordarlos. Puedes
          descubrir una actividad nueva mientras tanto.
        </p>
        <button class="button button-secondary" data-play-filter-reset>
          Ver todas las actividades →
        </button>
      </div>
      <div class="tip-card horizontal">
        <strong>¿Todavía te suenan nuevos los nombres?</strong>
        <p>La ruta de estudio explica las siete capas antes de que tengas que reconocerlas.</p>
        <a class="text-link" href="#/study">Ir a estudiar →</a>
      </div>`,
    bind() {
      bindPlayFilters(app);
      const cancel = allowsPrefetch() ? idleTask(() => app.prefetchScreen('setup')) : () => {};
      document.querySelectorAll('[data-quickstart]').forEach((button) => {
        button.addEventListener('click', () => {
          const kind = button.dataset.quickstart;
          app.startActivity(kind, app.repository.activityOptions(kind));
        });
      });
      return cancel;
    },
  };
}
