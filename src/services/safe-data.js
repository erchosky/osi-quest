const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
/** Reject dangerous keys and bound work, allowing ordinary shared references. */
export function assertSafeStructure(root) {
  const queue = [{ value: root, depth: 0, exit: false }];
  const ancestors = new WeakSet();
  let nodes = 0;
  while (queue.length) {
    const { value, depth, exit } = queue.pop();
    if (!value || typeof value !== 'object') continue;
    if (exit) {
      ancestors.delete(value);
      continue;
    }
    if (ancestors.has(value)) throw new Error('La copia contiene referencias circulares.');
    if (depth > 24 || ++nodes > 50000)
      throw new Error('La copia tiene una estructura demasiado compleja.');
    ancestors.add(value);
    queue.push({ value, depth, exit: true });
    for (const key of Object.keys(value)) {
      if (forbidden.has(key)) throw new Error('La copia contiene claves no permitidas.');
      queue.push({ value: value[key], depth: depth + 1, exit: false });
    }
  }
}
