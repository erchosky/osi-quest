import { setHTML } from '../../components/dom-renderer.js';
import { safeLink } from '../../services/links.js';
import { glossary } from '../../data/glossary.js';
import { sources } from '../../data/sources.js';
import { html, pageHeading, escapeHtml, raw } from '../../components/html.js';

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const searchIndex = glossary.map((item) => ({
  item,
  text: normalize(`${item.term} ${item.definition} ${item.category}`),
}));
export function glossaryView() {
  return {
    section: 'explore',
    title: 'Diccionario',
    html: html`<a class="text-link" href="#/explore">← Todas las herramientas</a>${raw(
        pageHeading(
          'LAS PALABRAS TAMBIÉN CONECTAN',
          'Diccionario de redes.',
          'Explicaciones breves para cuando un término se te atraviese.',
        ),
      )}<label class="search-field"
        ><span>Buscar un término o concepto</span
        ><input
          id="glossary-search"
          type="search"
          placeholder="Prueba con IP, puerto, señal…"
          autocomplete="off"
      /></label>
      <p class="small-note" id="glossary-count" aria-live="polite">${glossary.length} términos</p>
      <div class="glossary-grid" id="glossary-results">${raw(renderTerms(glossary))}</div>
      <section class="panel sources-panel">
        <p class="eyebrow">PARA SEGUIR APRENDIENDO</p>
        <h2>Fuentes y referencias</h2>
        <p>
          Contenido explicado y adaptado para empezar desde cero. Las analogías simplifican; las
          notas aclaran dónde termina la comparación.
        </p>
        <div class="source-links">
          ${raw(
            sources
              .map(
                (source) =>
                  html`<a href="${safeLink(source.url)}" target="_blank" rel="noreferrer"
                    >${source.title} ↗</a
                  >`,
              )
              .join(''),
          )}
        </div>
      </section>`,
    bind() {
      let timer;
      document.querySelector('#glossary-search').addEventListener('input', (event) => {
        clearTimeout(timer);
        const input = event.target.value;
        timer = setTimeout(() => {
          const query = normalize(input.trim());
          const matches = searchIndex
            .filter((entry) => entry.text.includes(query))
            .map((entry) => entry.item);
          setHTML(
            document.querySelector('#glossary-results'),
            renderTerms(matches) ||
              '<div class="notice">No encontramos ese término. Prueba con otra palabra.</div>',
          );
          document.querySelector('#glossary-count').textContent =
            `${matches.length} ${matches.length === 1 ? 'término' : 'términos'}`;
        }, 150);
      });
      return () => clearTimeout(timer);
    },
  };
}

function renderTerms(items) {
  return items
    .map(
      (item) =>
        html`<article class="panel glossary-term">
          <span class="badge">${raw(escapeHtml(item.category))}</span>
          <h2>${raw(escapeHtml(item.term))}</h2>
          <p>${raw(escapeHtml(item.definition))}</p>
        </article>`,
    )
    .join('');
}
