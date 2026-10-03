import { html, escapeHtml, raw } from '../../components/html.js';
import { layers } from '../../data/layers.js';
import { formatDuration } from '../../domain/round-report.js';

export function resultInsights(report, { selfRated = false } = {}) {
  const percent = report.total ? (report.correct / report.total) * 100 : 0;
  const baseline = report.baseline;
  const delta =
    baseline?.percent === null || !baseline ? null : Math.round(percent - baseline.percent);
  return html`<section class="panel result-insights">
    <h2>Tu ronda, con contexto.</h2>
    <div class="insight-grid">
      <div>
        <span>Tiempo activo</span><strong>${formatDuration(report.durationMs)}</strong
        ><small>Se excluyen pausas, otras pantallas y pestañas ocultas.</small>
      </div>
      <div>
        <span
          >${report.recovery ? 'Recuperación inmediata' : selfRated ? 'Tu recuerdo declarado' : 'Comparado con tu media'}</span
        ><strong
          >${report.recovery ? 'Práctica con la solución reciente' : delta === null ? 'Tu punto de partida' : `${delta > 0 ? '+' : ''}${delta} puntos`}</strong
        ><small
          >${report.recovery ? 'Este repaso no cuenta como evidencia de dominio ni cambia tu calendario de repaso.' : delta === null ? 'Necesitas una ronda anterior comparable.' : `Media: ${Math.round(baseline.percent)}% en ${baseline.rounds} rondas ${report.challengeCode ? 'del mismo reto de clase' : 'del mismo modo y nivel'}${report.timed ? ', con reloj' : ''}.`}</small
        >
      </div>
    </div>
    <h3>${selfRated ? 'Qué volver a recordar' : 'Qué reforzar por capa'}</h3>
    ${raw(failureList(report.failures, { selfRated }))}
  </section>`;
}

export function bindResultActions(app) {
  document.querySelector('#retry-mistakes')?.addEventListener('click', () => app.repeatMistakes());
  document
    .querySelector('#repeat-retry')
    ?.addEventListener('click', () =>
      app.startActivity(app.activity.kind, app.activity.launchOptions),
    );
}

export function failureList(failures, { selfRated = false } = {}) {
  return failures?.length
    ? `<ul class="failure-layers">${failures
        .map(
          (item) =>
            `<li><a href="#/study/${item.layer ? `layer-${item.layer}` : 'basics'}">${escapeHtml(item.layer ? layers[item.layer - 1].name : 'Fundamentos')}</a><span>${[
              [item.wrong, selfRated ? 'por recordar' : item.wrong === 1 ? 'fallo' : 'fallos'],
              [item.assisted, 'con ayuda'],
              [item.unanswered, 'sin responder'],
              [item.timedOut, 'fuera de tiempo'],
            ]
              .filter(([count]) => count)
              .map(([count, label]) => `${count} ${label}`)
              .join(' · ')}</span></li>`,
        )
        .join('')}</ul>`
    : '<p class="small-note">No quedaron ideas pendientes en esta ronda.</p>';
}
