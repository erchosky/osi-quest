import { setHTML } from '../components/dom-renderer.js';
import { icon } from '../components/icons.js';
import { html, raw } from '../components/html.js';
import { profileMenu, bindProfileMenu, updateProfileMenu } from '../components/profile-menu.js';

const sections = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'study', label: 'Estudiar', icon: 'study' },
  { id: 'play', label: 'Jugar', icon: 'play' },
  { id: 'explore', label: 'Explorar', icon: 'explore' },
  { id: 'progress', label: 'Mi progreso', icon: 'progress' },
];

let savedTimer;
export function showSaved() {
  const status = document.querySelector('#save-status');
  if (!status) return;
  status.textContent = 'Guardado ✓';
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => {
    status.textContent = '';
  }, 1800);
}
export function mountShell() {
  setHTML(
    document.querySelector('#app'),
    html` <aside class="app-sidebar">
        <a class="brand" href="#/home" aria-label="OSI Quest, inicio"
          ><span class="brand-logo">${raw(icon('layers'))}</span>osi<span>quest.</span></a
        >
        <p class="sidebar-label">TU ESPACIO DE APRENDIZAJE</p>
        <nav class="main-nav" aria-label="Navegación principal">
          ${raw(
            sections
              .map(
                (section) =>
                  `<a href="#/${section.id}" data-section="${section.id}" aria-label="${section.label}">${icon(section.icon)}<span>${section.label}</span>${icon('arrow', 'nav-arrow')}</a>`,
              )
              .join(''),
          )}
        </nav>
        <a class="sidebar-story" href="#/story" aria-label="Mi red de casa">⌂ Mi red de casa</a>
        <div class="sidebar-footer">
          <span class="online-dot"></span>Aprende a tu ritmo<small
            >Sin cuenta · progreso local</small
          >
        </div>
      </aside>
      <div class="app-workspace">
        <header class="topbar">
          <a class="topbar-search" href="#/explore/glossary"
            >${raw(icon('explore'))}<span>Buscar un concepto</span></a
          >
          <div class="breadcrumb" id="breadcrumb" hidden></div>
          ${raw(profileMenu())}
          <span id="save-status" class="save-status" role="status"></span>
        </header>
        <aside id="screen-loading" class="screen-loading" role="status" hidden>
          Preparando pantalla…<span class="skeleton-lines" aria-hidden="true"
            ><i></i><i></i><i></i
          ></span>
        </aside>
        <main id="main" tabindex="-1">
          <div class="panel" role="status">Preparando tu espacio de aprendizaje…</div>
        </main>
        <footer class="app-footer">
          <span>Pequeños pasos. Grandes conexiones.</span
          ><span
            >Mayús+F: pantalla completa ·
            <a href="#/explore/glossary">Diccionario y fuentes</a></span
          >
        </footer>
      </div>
      <div id="reward-toast" class="reward-toast" role="status" aria-live="polite" hidden></div>`,
  );
  bindProfileMenu();
  document.querySelector('.skip-link').addEventListener('click', (event) => {
    event.preventDefault();
    const main = document.querySelector('#main');
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
}

export function updateShell(section, progress, title = '') {
  const known = sections.find((item) => item.id === section) ?? sections[0];
  document.querySelectorAll('.main-nav a').forEach((link) => {
    const active = link.dataset.section === section;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#breadcrumb').textContent = title
    ? `${known.label} / ${title}`
    : known.label;
  updateProfileMenu(progress);
  document.querySelector('#breadcrumb').hidden = !title;
}
