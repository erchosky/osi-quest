import { units } from '../../data/units.js';
import { layers } from '../../data/layers.js';
import { html, pageHeading, routeLink, escapeHtml, raw } from '../../components/html.js';
import { shuffle } from '../../domain/random.js';
import { bindLesson } from './lesson-controller.js';

export function lessonView(app, unit, content, section) {
  const id = unit.id,
    index = units.indexOf(unit),
    layer = layers.find((item) => item.number === unit.layer);
  app.lessonChecks ??= {};
  app.lessonNotes ??= {};
  const checkState = (app.lessonChecks[id] ??= {
    order: shuffle(content.check.choices.map((_, i) => i)),
    selected: null,
  });
  const minutes = Math.max(
    1,
    Math.ceil(
      [
        content.introduction,
        ...content.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.items ?? [])]),
      ]
        .join(' ')
        .split(/\s+/).length / 200,
    ),
  );
  const read = app.repository.data.read.includes(id);
  return {
    section: 'study',
    title: unit.title,
    html: html`<div class="lesson-layout">
      <aside class="lesson-nav">
        <p class="eyebrow">EN ESTA LECCIÓN</p>
        <nav class="lesson-section-nav" aria-label="Secciones de la lección">
          ${raw(content.sections.map((s, i) => `<a href="#/study/${id}/${i}" data-lesson-section="${i}">${i + 1}. ${escapeHtml(s.title.replace(/^\d+\.\s*/, ''))}</a>`).join(''))}
        </nav>
        <details class="lesson-route">
          <summary>Tu ruta · ${units.length} lecciones</summary>
          ${raw(units.map((item, i) => `<a href="#/study/${item.id}" ${item.id === id ? 'aria-current="page"' : ''}><span>${app.repository.data.read.includes(item.id) ? '✓' : String(i + 1).padStart(2, '0')}</span>${escapeHtml(item.title)}</a>`).join(''))}
        </details>
      </aside>
      <article class="lesson">
        <div class="lesson-toolbar">
          <a class="text-link" href="#/study">← Todas las lecciones</a
          ><button
            class="button button-ghost"
            id="reading-focus"
            aria-pressed="${app.exploration.readingFocus}"
          >
            ${app.exploration.readingFocus ? 'Mostrar navegación' : 'Lectura sin distracciones'}
          </button>
        </div>
        ${raw(pageHeading(`LECCIÓN ${index + 1} / ${units.length} · ${minutes} MIN ORIENTATIVOS`, unit.title, unit.description))}
        <div class="lesson-reading-meter">
          <label for="reading-progress"
            >Tu recorrido
            <span id="reading-progress-label"
              >0 de ${content.sections.length} secciones</span
            ></label
          ><progress id="reading-progress" max="${content.sections.length}" value="0"></progress
          ><small>No mide dominio: marca dónde estás leyendo.</small>
        </div>
        <details class="lesson-mobile-toc">
          <summary>Índice de esta lección</summary>
          ${raw(content.sections.map((s, i) => `<a href="#/study/${id}/${i}">${i + 1}. ${escapeHtml(s.title.replace(/^\d+\.\s*/, ''))}</a>`).join(''))}
        </details>
        <p class="lesson-intro">${raw(escapeHtml(content.introduction))}</p>
        ${raw(layer ? `<div class="layer-summary" style="--layer-color:${layer.color};--layer-tint:${layer.tint}"><span class="layer-number">${layer.number}</span><div><strong>${escapeHtml(layer.verb)}</strong><span>${escapeHtml(layer.unit)}</span></div></div>` : '')}
        ${raw(content.sections.map((s, i) => `<section class="lesson-section" id="lesson-section-${i}" tabindex="-1"><h2>${escapeHtml(s.title.replace(/^\d+\.\s*/, ''))}</h2>${(s.paragraphs ?? []).map((text) => `<p>${escapeHtml(text)}</p>`).join('')}${s.items ? `<ul>${s.items.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>` : ''}</section>`).join(''))}
        <div class="takeaway">
          <span class="eyebrow">EN UNA FRASE</span>
          <p>${raw(escapeHtml(content.takeaway))}</p>
        </div>
        <section class="teach-back">
          <h2>Explícalo con tus palabras.</h2>
          <p>
            Sin mirar, ¿qué función acabas de aprender? Cuenta un ejemplo y una cosa que no
            demuestra.
          </p>
          <label for="lesson-notes">Tu explicación personal</label
          ><textarea
            id="lesson-notes"
            rows="3"
            placeholder="Por ejemplo: la señal permite transmitir, pero no demuestra que DNS funcione…"
          >
${raw(escapeHtml(app.lessonNotes[id] ?? ''))}</textarea
          ><small>Notas temporales en esta pestaña. No se califican ni suman XP.</small>
          <details>
            <summary>Una respuesta orientativa</summary>
            <p>${raw(escapeHtml(content.takeaway))}</p>
          </details>
        </section>
        <section class="lesson-check panel">
          <p class="eyebrow">COMPRUEBA LA IDEA</p>
          <h3>${raw(escapeHtml(content.check.prompt))}</h3>
          <div class="answer-list">
            ${raw(checkState.order.map((i) => `<button class="answer ${checkState.selected !== null && i === content.check.correctIndex ? 'is-correct' : ''} ${checkState.selected === i && i !== content.check.correctIndex ? 'is-wrong' : ''}" data-check="${i}" ${checkState.selected !== null ? 'aria-disabled="true"' : ''}>${escapeHtml(content.check.choices[i])}${checkState.selected !== null && i === content.check.correctIndex ? '<span>✓ Correcta</span>' : checkState.selected === i ? '<span>✗ Tu respuesta</span>' : ''}</button>`).join(''))}
          </div>
          <div id="lesson-feedback" aria-live="polite">
            ${raw(checkState.selected === null ? '' : checkFeedback(content.check, checkState.selected))}
          </div>
        </section>
        <div class="lesson-end" id="lesson-end">
          <button class="button button-primary" id="complete-lesson">
            ${read ? 'Lección completada ✓' : 'Marcar como leída ✓'}</button
          >${raw(index < units.length - 1 ? routeLink(`study/${units[index + 1].id}`, 'Siguiente lección →') : routeLink('play', 'Practicar lo aprendido →'))}${raw(read ? '<button class="button button-ghost" id="unread-lesson">Marcar para releer</button>' : '')}
        </div>
        <aside
          class="lesson-next-dock"
          id="lesson-next-dock"
          hidden
          aria-label="Continuar estudiando"
        >
          ${raw(index < units.length - 1 ? routeLink(`study/${units[index + 1].id}`, 'Siguiente lección →', 'button button-primary') : routeLink('play', 'Practicar lo aprendido →', 'button button-primary'))}
        </aside>
      </article>
    </div>`,
    bind() {
      return bindLesson(app, unit, content, section);
    },
  };
}
export function checkFeedback(check, selected) {
  return `<div class="feedback ${selected === check.correctIndex ? 'feedback-correct' : 'feedback-wrong'}"><strong>${selected === check.correctIndex ? '✓ Has conectado la idea.' : '✗ Vamos a aclararlo.'}</strong><p>${escapeHtml(check.explanation)}</p><small>Comprobación de estudio · sin XP ni evidencia de dominio.</small></div>`;
}
