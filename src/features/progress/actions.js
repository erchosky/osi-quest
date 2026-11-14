import { fieldError } from '../../components/field-error.js';
import { downloadText } from '../../services/download.js';
import { readBackup } from '../../services/backup-reader.js';
import { confirmAction } from '../../components/dialog.js';

export function bindProgressActions(app) {
  document.querySelector('#export-progress').addEventListener('click', () => {
    downloadText(
      `osi-quest-progreso-${new Date().toISOString().slice(0, 10)}.json`,
      app.repository.export({ includeHistory: document.querySelector('#export-history').checked }),
    );
    app.announce('Copia de progreso exportada.');
  });
  document.querySelector('#import-progress').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    fieldError(event.target, document.querySelector('#backup-status'), 'Validando la copia…');
    event.target.removeAttribute('aria-invalid');
    try {
      if (file.size > 2_000_000)
        throw new Error('La copia es demasiado grande. Elige un archivo de progreso de OSI Quest.');
      const candidate = await readBackup(await file.text());
      if (
        !(await confirmAction({
          title: '¿Usar esta copia?',
          description: `Contiene ${candidate.xp} XP y ${candidate.read.length} lecciones leídas. Reemplazará el progreso actual (${app.repository.data.xp} XP, ${app.repository.data.read.length} lecciones).${app.hasOpenRound() ? ' También se perderá la ronda pausada o en curso.' : ''}`,
          confirmLabel: 'Importar progreso',
        }))
      )
        return;
      app.repository.restore(candidate);
      app.lessonNotes = { ...app.repository.data.lessonNotes };
      app.lessonDrafts = {};
      app.abandonRound();
      app.refresh();
      app.announce('Progreso importado.');
    } catch (error) {
      fieldError(event.target, document.querySelector('#backup-status'), error.message);
    } finally {
      const status = document.querySelector('#backup-status');
      if (status?.textContent === 'Validando la copia…') status.textContent = '';
      event.target.value = '';
    }
  });
  document.querySelector('#clear-history').addEventListener('click', async () => {
    if (
      !(await confirmAction({
        title: '¿Borrar solo el historial?',
        description:
          'Se eliminan los resultados de rondas; tus XP, lecciones y repasos permanecen.',
        confirmLabel: 'Borrar historial',
        danger: true,
      }))
    )
      return;
    app.repository.clearHistory();
    app.refresh();
    app.announce('Historial borrado. Tu aprendizaje se conserva.');
  });
  document.querySelector('#reset-progress').addEventListener('click', async () => {
    if (
      !(await confirmAction({
        title: '¿Borrar tu progreso?',
        description:
          'Se borrarán los XP, las lecciones y los repasos en todas las pestañas de este navegador. Puedes exportar una copia antes.' +
          (app.repository.originalProgress !== null
            ? ' También se eliminará el original dañado que conservamos: descárgalo antes desde el aviso de guardado.'
            : '') +
          (app.hasOpenRound() ? ' La ronda actual también se perderá.' : ''),
        confirmLabel: 'Borrar progreso',
        danger: true,
      }))
    )
      return;
    app.repository.reset();
    app.lessonNotes = {};
    app.lessonDrafts = {};
    app.abandonRound();
    app.refresh();
    app.announce('Progreso borrado.');
  });
}
