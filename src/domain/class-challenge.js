import { classModes } from '../data/class-modes.js';
import { CLASS_REVISION } from '../data/class-revision.js';
export { CLASS_REVISION };
// Bump the format version if selection or shuffling algorithms change.
const FORMAT = 'OSI2';

export function createChallenge({ mode = 'FUN', difficulty = 'normal', seed }) {
  const selected = classModes.find((item) => item.id === mode);
  if (!selected) throw new Error('Elige una actividad disponible para la clase.');
  if (!['normal', 'hard'].includes(difficulty)) throw new Error('Elige normal o difícil.');
  if (selected.kind === 'cases' && difficulty !== 'normal')
    throw new Error('Los casos guiados se comparten en nivel normal.');
  const normalized = String(seed ?? '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9]{1,24}$/.test(normalized))
    throw new Error('La semilla debe tener entre 1 y 24 letras o números, sin espacios.');
  return Object.freeze({
    ...selected,
    mode,
    difficulty,
    seed: normalized,
    revision: CLASS_REVISION,
    code: `${FORMAT}-${mode}-${difficulty === 'hard' ? 'D' : 'N'}-${normalized}-${CLASS_REVISION}`,
  });
}

export function parseChallenge(value) {
  let code = String(value ?? '').trim();
  if (code.length > 2048) throw new Error('Ese código o enlace es demasiado largo.');
  if (/^https?:\/\//i.test(code) || code.startsWith('#/')) {
    try {
      const hash = new URL(code, 'https://osi.invalid/').hash;
      const match = /^#\/class\/([^/?#]+)$/.exec(hash);
      if (!match) throw new Error();
      code = decodeURIComponent(match[1]);
    } catch {
      throw new Error('El enlace no contiene un reto de clase válido.');
    }
  }
  code = code.toUpperCase();
  if (code.startsWith('OSI1-'))
    throw new Error(
      'Este reto pertenece al banco anterior. Pide un código nuevo creado con la misma versión de la app.',
    );
  const match = /^OSI2-([A-Z0-9]{3,4})-([ND])-([A-Z0-9]{1,24})-([A-F0-9]{8})$/.exec(code);
  if (!match)
    throw new Error('Ese código no es válido. Copia el código completo que empieza por OSI2.');
  if (match[4] !== CLASS_REVISION)
    throw new Error(
      'Este reto usa otra versión del contenido. Abre la misma versión de la app que quien lo creó.',
    );
  return createChallenge({
    mode: match[1],
    difficulty: match[2] === 'D' ? 'hard' : 'normal',
    seed: match[3],
  });
}

export function challengeLink(code, base) {
  const url = new URL(base);
  if (!['https:', 'http:'].includes(url.protocol))
    throw new Error('El enlace de clase necesita una dirección web.');
  url.search = '';
  url.hash = `/class/${encodeURIComponent(code)}`;
  return url.href;
}

export function challengeOptions(challenge) {
  return {
    difficulty: challenge.difficulty,
    direction: challenge.direction,
    caseId: challenge.caseId,
    seed: challenge.code,
    challenge,
  };
}
