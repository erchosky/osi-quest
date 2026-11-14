import { downloadText } from '../services/download.js';

/** Last-resort recovery never resets saved learning or prints personal input. */
export function installErrorRecovery(getApp) {
  const entries = [];
  let open = false;
  const report = (type) => {
    const app = getApp();
    entries.push({
      type,
      when: new Date().toISOString(),
      route: app?.currentRoute?.split('/')[0] ?? 'startup',
    });
    if (entries.length > 20) entries.shift();
    if (open) return;
    open = true;
    if (app) {
      app.roundSuspended = true;
      app.updateActivityClocks?.();
    }
    const dialog = document.createElement('dialog');
    dialog.className = 'dialog';
    const title = document.createElement('h2');
    title.id = 'recovery-title';
    title.textContent = 'Algo ha fallado';
    dialog.setAttribute('aria-labelledby', title.id);
    const text = document.createElement('p');
    text.textContent =
      'Tu progreso guardado se conserva. Puedes descargar una copia antes de volver a cargar. La ronda actual está pausada; recargar pierde lo que quede de esa ronda.';
    const actions = document.createElement('div');
    actions.className = 'actions';
    const button = (label, run) => {
      const node = document.createElement('button');
      node.className = 'button button-secondary';
      node.textContent = label;
      node.addEventListener('click', run);
      actions.append(node);
    };
    if (app)
      button('Descargar progreso', () =>
        downloadText(
          `osi-quest-recuperacion-${new Date().toISOString().slice(0, 10)}.json`,
          app.repository.export(),
        ),
      );
    button('Descargar diagnóstico', () =>
      downloadText(
        'osi-quest-diagnostico.json',
        JSON.stringify({ version: '3.9', events: entries }, null, 2),
      ),
    );
    button('Volver a cargar', () => location.reload());
    button('Cerrar y seguir', () => dialog.close());
    dialog.append(title, text, actions);
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      open = false;
      dialog.remove();
      if (app) {
        app.roundSuspended = false;
        app.updateActivityClocks?.();
      }
    });
    dialog.showModal();
  };
  window.addEventListener('error', (event) => {
    if (event instanceof ErrorEvent) report('error');
  });
  window.addEventListener('unhandledrejection', () => report('unhandledrejection'));
}
