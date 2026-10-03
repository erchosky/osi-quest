import { hashText } from '../domain/random.js';
export function serializeProgress(data, pretty = false) {
  const payload = JSON.stringify(data);
  return JSON.stringify(
    { ...data, integrity: { algorithm: 'fnv1a32', value: hashText(payload) } },
    null,
    pretty ? 2 : undefined,
  );
}
export function verifyIntegrity(value) {
  if (!value.integrity) return;
  const { integrity, ...payload } = value;
  if (
    integrity.algorithm !== 'fnv1a32' ||
    typeof integrity.value !== 'string' ||
    hashText(JSON.stringify(payload)) !== integrity.value
  )
    throw new Error(
      'La suma de control no coincide. Se conserva el original; usa una copia válida.',
    );
}
