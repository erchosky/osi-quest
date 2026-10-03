import { escapeHtml } from './html.js';
import { downloadText } from '../services/download.js';
export function storageNotice(repository) {
  const issue = repository.storageIssue;
  if (!issue) return '';
  const message =
    issue === 'corrupt'
      ? 'El progreso guardado no se puede leer. Conservamos el original y no lo sobrescribimos. Puedes jugar en memoria y exportar lo nuevo; importar una copia válida o borrar el progreso permite guardar otra vez.'
      : issue === 'quota'
        ? 'El almacenamiento está lleno. Estos cambios están en memoria: exporta una copia antes de cerrar o libera espacio y vuelve a guardar.'
        : 'No se puede guardar en este navegador. El progreso de esta pestaña está en memoria: exporta una copia antes de cerrar.';
  return `<aside class="notice storage-notice" role="status"><p>${escapeHtml(message)}</p><div class="button-row">${repository.originalProgress !== null ? '<button class="button button-secondary" id="save-original-progress">Descargar original</button>' : ''}<a class="button button-secondary" href="#/progress">Copias y recuperación →</a></div></aside>`;
}
export function bindStorageNotice(app) {
  document
    .querySelector('#save-original-progress')
    ?.addEventListener('click', () =>
      downloadText(
        'osi-quest-original-no-modificado.txt',
        app.repository.originalProgress,
        'text/plain',
      ),
    );
}
