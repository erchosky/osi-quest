export function bindPacket(app) {
  const session = app.activity;
  function select(id, focusTray = false) {
    if (!session.select(id)) return;
    document.querySelectorAll('[data-packet-token]').forEach((button) => {
      const selected = button.dataset.packetToken === session.selected;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const choice = session.choices.find((item) => item.id === session.selected);
    const tray = document.querySelector('#packet-tray');
    tray.classList.add('has-piece');
    tray.classList.remove('is-over');
    tray.querySelector('strong').textContent = choice.label;
    tray.querySelector('small').textContent = 'Lista para probar: aún puedes cambiarla';
    document.querySelector('#packet-add').disabled = false;
    const target = focusTray
      ? document.querySelector('#packet-add')
      : [...document.querySelectorAll('[data-packet-token]')].find(
          (button) => button.dataset.packetToken === id,
        );
    target?.focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-packet-token]').forEach((button) => {
    button.addEventListener('click', () => select(button.dataset.packetToken));
    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', button.dataset.packetToken);
      event.dataTransfer.effectAllowed = 'copy';
    });
  });
  const tray = document.querySelector('#packet-tray');
  if (!session.placed) {
    tray.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      tray.classList.add('is-over');
    });
    tray.addEventListener('dragleave', () => tray.classList.remove('is-over'));
    tray.addEventListener('drop', (event) => {
      event.preventDefault();
      select(event.dataTransfer.getData('text/plain'), true);
    });
  }
  document.querySelector('#packet-add')?.addEventListener('click', () => {
    const outcome = session.place();
    if (!outcome) return;
    if (outcome.correct && !app.activity.practiceOnly)
      app.repository.recordActivity(outcome, 'packet');
    app.refresh();
    app.announce(session.feedback.text);
    document
      .querySelector(outcome.correct ? '#packet-next' : '#packet-feedback')
      ?.focus({ preventScroll: true });
  });
  document.querySelector('#packet-hint')?.addEventListener('click', () => {
    if (!session.hint()) return;
    app.refresh();
    document.querySelector('#packet-hint-text')?.focus({ preventScroll: true });
  });
  document.querySelector('#packet-next')?.addEventListener('click', () => {
    if (!session.next()) return;
    if (session.done) app.completeRound();
    app.refresh();
    const title = document.querySelector('#packet-title, .result-hero h1');
    if (title) {
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
      title.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  });
}
