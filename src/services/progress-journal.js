import { hashText } from '../domain/random.js';
import { serializeProgress, verifyIntegrity } from './progress-integrity.js';
import { assertSafeStructure } from './safe-data.js';
import { STORAGE_KEY } from './progress-schema.js';
import { journalArguments } from './journal-arguments.js';

export const JOURNAL_PREFIX = `${STORAGE_KEY}:operation:`;
const BASE_KEY = `${STORAGE_KEY}:base`;
export const MUTATIONS = [
  'saveLessonNote',
  'setRadarLevel',
  'setDifficulty',
  'setPlayFilter',
  'rememberActivity',
  'rememberLesson',
  'setRead',
  'markRead',
  'completeChapter',
  'recordAnswers',
  'recordAnswer',
  'recordOrder',
  'recordActivity',
  'rateCard',
  'recordRound',
  'clearHistory',
  'restore',
  'reset',
];

/** Independent keys avoid read/modify/write races between browser processes. */
export function createProgressJournal(storage, initial, replay, freshEpoch = false) {
  if (!storage || typeof storage.key !== 'function') return null;
  if (storage.getItem(BASE_KEY) === null)
    storage.setItem(
      BASE_KEY,
      serializeProgress({
        progress: initial,
        applied: [],
        epoch: freshEpoch ? crypto.randomUUID() : 'initial-' + hashText(JSON.stringify(initial)),
      }),
    );
  let lastOrder = 0;
  let epoch;
  let cachedBaseRaw;
  let cachedBase;
  let included;
  let previousOperations = [];
  let previousData;
  let previousBaseRaw;
  let operationCount = 0;
  let maintenance;
  const parsed = new Map();
  function read() {
    const raw = storage.getItem(BASE_KEY);
    if (!raw || raw.length > 2_000_000) throw new Error('Registro de progreso no válido.');
    if (raw !== cachedBaseRaw) {
      const candidate = JSON.parse(raw);
      assertSafeStructure(candidate);
      verifyIntegrity(candidate);
      if (!candidate.progress || !Array.isArray(candidate.applied))
        throw new Error('Registro no válido.');
      cachedBase = candidate;
      cachedBaseRaw = raw;
      included = new Set(candidate.applied);
    }
    const base = cachedBase;
    epoch = base.epoch;
    const includedPresent = [];
    const obsolete = [];
    const operations = [];
    const present = new Set();
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(JOURNAL_PREFIX)) continue;
      if (included.has(key)) {
        includedPresent.push(key);
        continue;
      }
      const value = storage.getItem(key);
      if (!value || value.length > 2_000_000) throw new Error('Operación no válida.');
      present.add(key);
      let entry = parsed.get(key);
      if (!entry || entry.raw !== value) {
        const event = JSON.parse(value);
        assertSafeStructure(event);
        verifyIntegrity(event);
        if (
          !MUTATIONS.includes(event.method) ||
          !Array.isArray(event.args) ||
          !Number.isSafeInteger(event.order) ||
          !Number.isSafeInteger(event.time) ||
          event.time < 0
        )
          throw new Error('Operación no válida.');
        entry = { raw: value, event: { key, ...event } };
        parsed.set(key, entry);
      }
      const event = entry.event;
      if (event.epoch !== epoch) {
        obsolete.push(key);
        continue;
      }
      operations.push(event);
    }
    if (storage.getItem(BASE_KEY) !== raw) return read();
    operations.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
    lastOrder = base.lastOrder ?? 0;
    for (const event of operations) lastOrder = Math.max(lastOrder, event.order);
    for (const key of parsed.keys()) if (!present.has(key)) parsed.delete(key);
    const incremental =
      previousData &&
      raw === previousBaseRaw &&
      previousOperations.length <= operations.length &&
      previousOperations.every((event, index) => event === operations[index]);
    if (incremental) {
      const added = operations.slice(previousOperations.length);
      if (added.length) previousData = replay(previousData, added);
    } else previousData = replay(base.progress, operations);
    previousBaseRaw = raw;
    previousOperations = operations;
    operationCount = operations.length;
    return {
      // The repository mutates its copy; it must never mutate the cached canonical snapshot.
      data: JSON.parse(JSON.stringify(previousData)),
      keys: obsolete.concat(
        includedPresent,
        operations.map((e) => e.key),
      ),
      count: operations.length,
      lastOrder,
    };
  }
  function prepare(method, args, time) {
    const key = JOURNAL_PREFIX + crypto.randomUUID();
    const value = serializeProgress({
      method,
      epoch,
      args: journalArguments(method, args),
      time,
      order: (lastOrder = Math.max(lastOrder + 1, time * 1024)),
    });
    return { key, value };
  }
  const append = (event) => storage.setItem(event.key, event.value);
  function compact() {
    // Writers never acquire this lock: they only append unique keys. Compactors
    // serialize with each other and delete exactly the operations in their base.
    if (maintenance) return maintenance;
    if (operationCount < 128) return Promise.resolve();
    maintenance = new Promise((resolve) => {
      const schedule = globalThis.requestIdleCallback ?? ((task) => setTimeout(task, 0));
      schedule(resolve, { timeout: 1000 });
    })
      .then(() => import('./journal-maintenance.js'))
      .then(({ coordinatedMaintenance }) =>
        coordinatedMaintenance(() => {
          const snapshot = read();
          if (snapshot.count < 128) return;
          storage.setItem(
            BASE_KEY,
            serializeProgress({
              progress: snapshot.data,
              epoch,
              applied: snapshot.keys,
              lastOrder: snapshot.lastOrder,
            }),
          );
          for (const key of snapshot.keys) storage.removeItem(key);
          parsed.clear();
          previousOperations = [];
          previousData = undefined;
          previousBaseRaw = undefined;
          operationCount = 0;
          // Keep applied IDs until the next compaction: interrupted deletion remains idempotent.
        }),
      )
      .finally(() => {
        maintenance = null;
      });
    return maintenance;
  }
  return { read, prepare, append, compact };
}

export function clearProgressJournal(storage) {
  if (!storage || typeof storage.key !== 'function') return;
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(
    (key) => key === BASE_KEY || key?.startsWith(JOURNAL_PREFIX),
  );
  for (const key of keys) storage.removeItem(key);
}
