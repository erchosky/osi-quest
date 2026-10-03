/** Fisher–Yates. An injectable random source keeps selection testable. */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/** Stable 32-bit text hash. Used for reproducibility, never for security. */
export function hashText(text) {
  const input = String(text);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').toUpperCase();
}

/** Each invocation returns a fresh deterministic stream for the same seed. */
export function seededRandom(seed) {
  let state = Number.parseInt(hashText(seed), 16);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
