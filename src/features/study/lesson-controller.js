import { appendHTML, setHTML } from '../../components/dom-renderer.js';
import { checkFeedback } from './lesson-view.js';

export function bindLesson(app, unit, content, requestedSection) {
  const id = unit.id;
  const sections = [...document.querySelectorAll('.lesson-section')];
  const bookmark = app.repository.data.lessonBookmark;
  const initial = /^\d+$/.test(requestedSection ?? '')
    ? Number(requestedSection)
    : bookmark?.unitId === id
      ? bookmark.sectionIndex
      : 0;
  const dock = document.querySelector('#lesson-next-dock');
  const end = document.querySelector('#lesson-end');
  let reachedEnd = false;
  function updateDock() {
    const bounds = end.getBoundingClientRect();
    dock.hidden = !reachedEnd || (bounds.top < innerHeight && bounds.bottom > 0);
  }
  const endObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) reachedEnd = true;
    updateDock();
  });
  endObserver.observe(document.querySelector('.takeaway'));
  let frame = null,
    previous = -1;
  let bookmarkTimer = null;
  const flushBookmark = () => {
    if (bookmarkTimer !== null) {
      clearTimeout(bookmarkTimer);
      bookmarkTimer = null;
      app.repository.rememberLesson(id, previous);
    }
  };
  window.addEventListener('pagehide', flushBookmark);
  function position() {
    frame = null;
    if (reachedEnd) updateDock();
    let current = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= 160) current = i;
    });
    if (current === previous) return;
    previous = current;
    if (bookmarkTimer !== null) clearTimeout(bookmarkTimer);
    bookmarkTimer = setTimeout(flushBookmark, 250);
    document.querySelector('#reading-progress').value = current + 1;
    document.querySelector('#reading-progress-label').textContent =
      `${current + 1} de ${sections.length} secciones`;
    document.querySelectorAll('[data-lesson-section]').forEach((link) => {
      if (Number(link.dataset.lessonSection) === current)
        link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function onScroll() {
    if (frame === null) frame = requestAnimationFrame(position);
  }
  const restore = requestAnimationFrame(() => {
    if (initial > 0 && sections[initial]) {
      sections[initial].scrollIntoView({ block: 'start', behavior: 'auto' });
      sections[initial].focus({ preventScroll: true });
    }
    position();
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.querySelector('#reading-focus').addEventListener('click', () => {
    app.exploration.readingFocus = !app.exploration.readingFocus;
    app.refresh();
    document.querySelector('#reading-focus').focus({ preventScroll: true });
  });
  document.querySelector('#lesson-notes').addEventListener('input', (e) => {
    app.lessonNotes[id] = e.target.value.slice(0, 5000);
  });
  document.querySelectorAll('[data-check]').forEach((button) =>
    button.addEventListener('click', () => {
      const state = app.lessonChecks[id];
      if (state.selected !== null) return;
      state.selected = Number(button.dataset.check);
      document.querySelectorAll('[data-check]').forEach((option) => {
        option.setAttribute('aria-disabled', 'true');
        const value = Number(option.dataset.check);
        if (value === content.check.correctIndex) {
          option.classList.add('is-correct');
          appendHTML(option, '<span>✓ Correcta</span>');
        } else if (value === state.selected) {
          option.classList.add('is-wrong');
          appendHTML(option, '<span>✗ Tu respuesta</span>');
        }
      });
      setHTML(
        document.querySelector('#lesson-feedback'),
        checkFeedback(content.check, state.selected),
      );
    }),
  );
  document.querySelector('#complete-lesson').addEventListener('click', () => {
    app.repository.markRead(id);
    app.refresh();
    app.announce('Lección guardada como leída.');
  });
  document.querySelector('#unread-lesson')?.addEventListener('click', () => {
    app.repository.setRead(id, false);
    app.refresh();
    app.announce('Lección marcada para releer.');
  });
  return () => {
    flushBookmark();
    window.removeEventListener('pagehide', flushBookmark);
    endObserver.disconnect();
    window.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(restore);
    if (frame !== null) cancelAnimationFrame(frame);
  };
}
