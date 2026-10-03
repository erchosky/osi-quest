import { html, escapeHtml, raw } from '../../components/html.js';
import { layers } from '../../data/layers.js';
import { learningQuestions } from '../../data/progress-catalog.js';
import { misconceptions } from '../../data/progress-catalog.js';
import { layerMastery } from '../../domain/mastery.js';

const point = (index, radius) => {
  const angle = (index * Math.PI * 2) / 7 - Math.PI / 2;
  return [220 + Math.cos(angle) * radius, 200 + Math.sin(angle) * radius];
};
const polygon = (radii) =>
  radii
    .map((radius, index) =>
      point(index, radius)
        .map((value) => value.toFixed(1))
        .join(','),
    )
    .join(' ');

export function masteryView(app) {
  const level = app.profileDifficulty;
  const metrics = layers.map((layer) =>
    layerMastery(learningQuestions, app.repository.data.stats, layer.number, level),
  );
  return html`<section class="panel mastery-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">TU MAPA DE DOMINIO</p>
        <h2>Una vista de tus siete capas.</h2>
      </div>
      <div class="radar-filters" role="group" aria-label="Filtrar evidencia por dificultad">
        ${raw(
          [
            ['all', 'Todo'],
            ['normal', 'Normal'],
            ['hard', 'Difícil'],
          ]
            .map(
              ([id, label]) =>
                `<button data-radar-level="${id}" aria-pressed="${id === level}">${label}</button>`,
            )
            .join(''),
        )}
      </div>
    </div>
    <p class="small-note">
      Estimación de práctica: precisión sin ayuda × cobertura de cuatro preguntas distintas por
      capa. Una respuesta aislada deja evidencia limitada. Los filtros por nivel usan las respuestas
      registradas desde esta versión.
    </p>
    <div class="mastery-layout">
      <svg
        class="mastery-radar"
        viewBox="0 0 440 400"
        role="img"
        aria-labelledby="radar-title radar-description"
      >
        <title id="radar-title">Mapa de dominio de las siete capas</title>
        <desc id="radar-description">
          Los valores y la cantidad de evidencia se detallan en la lista junto al gráfico.
        </desc>
        ${raw([0.25, 0.5, 0.75, 1].map((ratio) => `<polygon points="${polygon(Array(7).fill(125 * ratio))}" class="radar-ring"/>`).join(''))}
        ${raw(
          layers
            .map((layer, index) => {
              const [x, y] = point(index, 125);
              const [lx, ly] = point(index, 167);
              return `<line x1="220" y1="200" x2="${x}" y2="${y}" class="radar-axis"/><text x="${lx}" y="${ly}" text-anchor="middle" class="radar-label radar-label-name">${layer.number} · ${escapeHtml(layer.name)}</text><text x="${lx}" y="${ly}" text-anchor="middle" class="radar-label radar-label-mobile">${layer.number}</text>`;
            })
            .join(''),
        )}
        <polygon
          points="${polygon(metrics.map((metric) => (metric.score / 100) * 125))}"
          class="radar-value"
        />
        ${raw(
          metrics
            .map((metric, index) => {
              const [x, y] = point(index, (metric.score / 100) * 125);
              return `<circle cx="${x}" cy="${y}" r="4" class="radar-dot"/>`;
            })
            .join(''),
        )}
      </svg>
      <ul class="mastery-evidence">
        ${raw(
          layers
            .map((layer, index) => {
              const metric = metrics[index];
              return html`<li>
                <a href="#/study/layer-${layer.number}"
                  ><strong>${layer.number}. ${raw(escapeHtml(layer.name))}</strong
                  ><span>${metric.attempts ? `${metric.score}/100` : 'Sin datos'}</span></a
                ><small
                  >${metric.correct}/${metric.attempts} aciertos · ${metric.unique} preguntas
                  distintas${metric.limited ? ' · evidencia limitada' : ''}</small
                >
              </li>`;
            })
            .join(''),
        )}
      </ul>
    </div>
  </section>`;
}

export function badgesView(app) {
  const data = app.repository.data.concepts;
  const earned = misconceptions.filter((item) => data[item.id]?.earnedAt).length;
  return html`<section class="panel badges-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">CONFUSIONES SUPERADAS</p>
        <h2>Ideas que ya distingues.</h2>
      </div>
      <span class="badge badge-lime">${earned}/${misconceptions.length} insignias</span>
    </div>
    <p class="small-note">
      Cada insignia requiere dos comprobaciones distintas acertadas sin ayuda. Un error o una pista
      reinicia la comprobación y requiere esperar 10 minutos antes de aportar nueva evidencia; una
      insignia ganada se conserva y avisa si conviene repasarla.
    </p>
    <div class="concept-badges">
      ${raw(
        misconceptions
          .map((concept) => {
            const state = data[concept.id];
            return html`<article class="concept-badge ${state?.earnedAt ? 'is-earned' : ''}">
              <span class="concept-emblem" aria-hidden="true">${concept.icon}</span>
              <div>
                <h3>${raw(escapeHtml(concept.title))}</h3>
                <p>${raw(escapeHtml(concept.description))}</p>
                <small
                  >${state?.retryAfter > Date.now() ? 'Recuperación guiada · nueva comprobación en unos 10 min' : state?.earnedAt ? (state.needsReview ? 'Ganada · conviene repasar' : 'Ganada · dos ideas comprobadas') : `${state?.proofIds.length ?? 0}/2 comprobaciones sin ayuda`}</small
                >
              </div>
              <button class="button button-secondary" data-concept-practice="${concept.id}">
                ${state?.earnedAt ? 'Repasar' : 'Comprobar'} →
              </button>
            </article>`;
          })
          .join(''),
      )}
    </div>
  </section>`;
}

export function bindMastery(app) {
  document.querySelectorAll('[data-radar-level]').forEach((button) =>
    button.addEventListener('click', () => {
      app.profileDifficulty = button.dataset.radarLevel;
      app.repository.setRadarLevel(app.profileDifficulty);
      app.refresh();
      document
        .querySelector(`[data-radar-level="${app.profileDifficulty}"]`)
        .focus({ preventScroll: true });
    }),
  );
  document.querySelectorAll('[data-concept-practice]').forEach((button) =>
    button.addEventListener('click', () =>
      app.startActivity('confusions', {
        difficulty: 'normal',
        conceptId: button.dataset.conceptPractice,
      }),
    ),
  );
}
