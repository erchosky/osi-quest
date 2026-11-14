import { STORAGE_KEY } from './progress-schema.js';

let connection;
function openCoordinator() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open(`${STORAGE_KEY}:maintenance`, 1);
      let expired = false;
      const timeout = setTimeout(() => {
        expired = true;
        reject(new Error('Coordinador no disponible.'));
      }, 2000);
      request.onupgradeneeded = () => request.result.createObjectStore('compact');
      request.onerror = () => {
        clearTimeout(timeout);
        reject(request.error);
      };
      request.onsuccess = () => {
        clearTimeout(timeout);
        const db = request.result;
        if (expired) {
          db.close();
          return;
        }
        db.onversionchange = () => {
          db.close();
          connection = null;
        };
        resolve(db);
      };
    }).catch((error) => {
      connection = null;
      throw error;
    });
  return connection;
}

/** Read/write transactions on this store serialize maintenance across tabs without Web Locks.
 * The callback must remain synchronous: no transaction gap between reading the base and deleting.
 */
export async function coordinatedMaintenance(task) {
  if (globalThis.navigator?.locks)
    return navigator.locks.request(`${STORAGE_KEY}:compact`, { ifAvailable: true }, (lock) => {
      if (lock) task();
    });
  if (!globalThis.indexedDB) return;
  const db = await openCoordinator();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('compact', 'readwrite');
    let failure;
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(failure ?? transaction.error);
    transaction.onerror = () => {};
    transaction.objectStore('compact').get('turn').onsuccess = () => {
      try {
        task();
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };
  });
}
