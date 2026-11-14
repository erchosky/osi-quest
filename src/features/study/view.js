import { notFoundView } from '../../app/routes.js';
import { units } from '../../data/units.js';
import { html, pageHeading, progressBar, escapeHtml, raw } from '../../components/html.js';
import { layerMap } from '../../components/layer-map.js';
import { cachedLesson, loadLessonContent } from './lesson-loader.js';
import { lessonView } from './lesson-view.js';

export function studyView(app, id, section) {
  const unit = units.find((item) => item.id === id);
  if (!unit) return studyIndex(app);
  const content = cachedLesson(unit);
  return content
    ? renderLesson(app, unit, content, section)
    : loadLessonContent(unit).then((loaded) => renderLesson(app, unit, loaded, section));
}

function renderLesson(app, unit, content, section) {
  if (
    section !== undefined &&
    (!/^\d+$/.test(section) || Number(section) >= content.sections.length)
  )
    return notFoundView();
  return lessonView(app, unit, content, section);
}

function studyIndex(app) {
  const read = app.repository.data.read;
  return {
    section: 'study',
    title: '',
    html: html`${raw(
        pageHeading(
          'EL MAPA ANTES DEL VIAJE',
          'Redes, desde el principio.',
          'Aprende qué hace cada capa, por qué existe y cómo reconocerla. Sin cronómetro, con ejemplos de la vida diaria.',
        ),
      )}
      <div class="study-overview">
        <div class="panel">
          <div class="section-heading">
            <h2>Tu ruta de aprendizaje</h2>
            <span class="badge">${read.length} / ${units.length}</span>
          </div>
          ${raw(progressBar((read.length / units.length) * 100, 'Lecciones leídas'))}
          <div class="unit-list">
            ${raw(
              units
                .map(
                  (unit, i) =>
                    html`<a class="unit-row" href="#/study/${unit.id}"
                      ><span class="unit-number ${read.includes(unit.id) ? 'completed' : ''}"
                        >${read.includes(unit.id) ? '✓' : String(i + 1).padStart(2, '0')}</span
                      >
                      <div>
                        <h3>${unit.title}</h3>
                        <p>${unit.description}</p>
                      </div>
                      <span class="unit-time">${unit.minutes} min</span><span>→</span></a
                    >`,
                )
                .join(''),
            )}
          </div>
        </div>
        <aside>
          <div class="panel">
            <p class="eyebrow">SIETE CAPAS, UNA IDEA</p>
            <h2>Un mensaje.<br />Distintas tareas.</h2>
            <p class="subtle">Pulsa una capa para conocerla.</p>
            ${raw(layerMap())}
            <p class="small-note">Al enviar: 7 → 1. Al recibir: 1 → 7.</p>
          </div>
          <div class="tip-card">
            <strong>Aprender no es correr.</strong>
            <p>
              Lee una lección, explícatela con tus palabras y prueba un reto. Vuelve cuando algo no
              encaje.
            </p>
          </div>
        </aside>
      </div>`,
  };
}
