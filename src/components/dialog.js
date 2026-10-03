import { setHTML } from './dom-renderer.js';
import { escapeHtml } from './html.js';

export function confirmAction({ title, description, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    const root = document.querySelector('#modal-root');
    if (root.querySelector('dialog[open]')) {
      resolve(false);
      return;
    }
    setHTML(
      root,
      `<dialog class="dialog"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><div class="actions"><button class="button button-secondary" data-dialog="cancel">Cancelar</button><button class="button ${danger ? 'button-danger' : 'button-primary'}" data-dialog="confirm">${escapeHtml(confirmLabel)}</button></div></dialog>`,
    );
    const dialog = root.querySelector('dialog');
    let answered = false;
    function finish(value) {
      if (answered) return;
      answered = true;
      dialog.close();
      root.replaceChildren();
      resolve(value);
    }
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(false);
    });
    dialog.querySelector('[data-dialog="cancel"]').addEventListener('click', () => finish(false));
    dialog.querySelector('[data-dialog="confirm"]').addEventListener('click', () => finish(true));
    dialog.showModal();
  });
}
