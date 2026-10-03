import { focusElement } from '../../components/focus.js';

export function bindMatching(app) {
  const session = app.activity;
  let draggedTask = null;
  const mobile = matchMedia('(max-width: 650px)').matches;
  const remainingTask = '[data-match-task]:not([aria-disabled="true"])';
  const remainingLayer = '[data-match-layer]:not([aria-disabled="true"])';

  function selectedControl() {
    return mobile && session.selectedTask
      ? `[data-match-form="${session.selectedTask}"] select`
      : session.selectedTask
        ? remainingLayer
        : remainingTask;
  }

  function refresh(outcome, focusSelector, announceError = true) {
    if (outcome) {
      if (!app.activity.practiceOnly) app.repository.recordActivity(outcome, 'matching');
      if (session.done) app.completeRound();
      app.announce(`Conexión correcta. Has ganado ${outcome.xp} XP.`);
    } else if (announceError && session.feedback?.correct === false) {
      app.announce(`Esta conexión todavía no encaja. ${session.feedback.explanation}`);
    }
    if (!outcome && !session.feedback && announceError) updateSelection();
    else app.refresh();
    if (session.done) focusElement('.result-hero h1');
    if (focusSelector && !session.done)
      document.querySelector(focusSelector)?.focus({ preventScroll: true });
  }

  function updateSelection() {
    document.querySelectorAll('[data-match-task]').forEach((button) => {
      const selected = button.dataset.matchTask === session.selectedTask;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      if (button.getAttribute('aria-disabled') !== 'true')
        button.querySelector('.matching-card-top > span:last-child').textContent = selected
          ? 'SELECCIONADA'
          : 'TAREA';
    });
    document.querySelectorAll('[data-match-layer]').forEach((button) => {
      const selected = Number(button.dataset.matchLayer) === session.selectedLayer;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document
      .querySelectorAll('.matching-piece > .feedback, .matching-piece > .hint')
      .forEach((node) => node.remove());
    const label = document.querySelector('.matching-selection');
    label.textContent = session.current
      ? `Conecta: ${session.current.title}`
      : session.selectedLayer
        ? `Elegida: ${document.querySelector(`[data-match-layer="${session.selectedLayer}"] strong`).textContent}. Ahora selecciona su tarea.`
        : 'Elige una tarea y busca la capa que realiza esa función.';
    const hint = document.querySelector('#matching-hint');
    const piece = [...document.querySelectorAll('[data-match-task]')].find(
      (button) => button.dataset.matchTask === session.selectedTask,
    )?.parentElement;
    hint.disabled = !session.current || session.hinted.has(session.selectedTask);
    hint.classList.toggle('matching-hint-button', Boolean(piece));
    hint.textContent = piece
      ? 'Una pista para esta tarea'
      : 'Selecciona una tarea para pedir una pista';
    if (piece) {
      if (session.hinted.has(session.selectedTask)) {
        const text = document.createElement('div');
        text.className = 'hint';
        text.setAttribute('role', 'status');
        text.textContent = session.current.hint;
        piece.append(text);
      }
      piece.append(hint);
    } else document.querySelector('.game-actions').prepend(hint);
  }

  document.querySelectorAll('[data-match-task]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      const outcome = session.selectTask(button.dataset.matchTask);
      refresh(outcome, selectedControl());
    });
    button.addEventListener('dragstart', (event) => {
      if (button.getAttribute('aria-disabled') === 'true' || !event.dataTransfer) return;
      draggedTask = button.dataset.matchTask;
      event.dataTransfer.setData('application/x-osi-task', draggedTask);
      event.dataTransfer.setData('text/plain', draggedTask);
      event.dataTransfer.effectAllowed = 'move';
    });
    button.addEventListener('dragend', () => {
      draggedTask = null;
      document
        .querySelectorAll('.is-drop-target')
        .forEach((target) => target.classList.remove('is-drop-target'));
    });
  });

  document.querySelectorAll('[data-match-layer]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      const outcome = session.selectLayer(Number(button.dataset.matchLayer));
      refresh(outcome, selectedControl());
    });
    button.addEventListener('dragover', (event) => {
      if (
        button.getAttribute('aria-disabled') === 'true' ||
        !event.dataTransfer?.types.includes('application/x-osi-task')
      )
        return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      button.classList.add('is-drop-target');
    });
    button.addEventListener('dragleave', () => button.classList.remove('is-drop-target'));
    button.addEventListener('drop', (event) => {
      event.preventDefault();
      if (button.getAttribute('aria-disabled') === 'true') return;
      const id = event.dataTransfer?.getData('application/x-osi-task') || draggedTask;
      refresh(session.pair(id, Number(button.dataset.matchLayer)), remainingTask);
    });
  });

  document.querySelectorAll('[data-match-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const id = form.dataset.matchForm;
      const outcome = session.pair(id, Number(new FormData(form).get('layer')));
      refresh(outcome, outcome ? `[data-match-task="${id}"]` : `[data-match-form="${id}"] select`);
    });
  });
  document.querySelectorAll('[data-match-hint]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!session.hint(button.dataset.matchHint)) return;
      app.announce(session.current.hint);
      refresh(null, selectedControl(), false);
    });
  });

  document.querySelector('#matching-hint')?.addEventListener('click', () => {
    if (!session.hint()) return;
    app.announce(session.current.hint);
    refresh(null, selectedControl(), false);
  });
}
