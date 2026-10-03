import { parseBackup } from './progress-schema.js';
import { backupWorkerURL } from '../components/dom-renderer.js';
/** Untrusted backup parsing runs off the UI thread, with a finite lifetime. */
export function readBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 2_000_000)
    return Promise.reject(new Error('La copia supera el límite de 2 MB.'));
  const url =
    typeof __BACKUP_WORKER__ === 'undefined'
      ? new URL('./backup-worker.js', import.meta.url)
      : new URL(__BACKUP_WORKER__, document.baseURI);
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(backupWorkerURL(url), { type: 'module' });
    } catch {
      setTimeout(() => {
        try {
          resolve(parseBackup(text));
        } catch (error) {
          reject(error);
        }
      }, 0);
      return;
    }
    const timer = setTimeout(
      () => finish(new Error('La copia tardó demasiado en validarse.')),
      10000,
    );
    function finish(error, candidate) {
      clearTimeout(timer);
      worker.terminate();
      if (error) reject(error);
      else resolve(candidate);
    }
    worker.onmessage = ({ data }) =>
      finish(data.error ? new Error(data.error) : null, data.candidate);
    worker.onerror = () => finish(new Error('No se pudo validar la copia. Vuelve a intentarlo.'));
    worker.postMessage(text);
  });
}
