const enabled = typeof __DEV__ === 'undefined' || __DEV__;
export function mark(name) {
  if (enabled) performance.mark(`osi:${name}`);
}
export function measure(name, start) {
  if (!enabled) return;
  try {
    performance.measure(`osi:${name}`, `osi:${start}`);
  } catch {}
  performance.clearMarks(`osi:${start}`);
  const entries = performance.getEntriesByType('measure').filter((e) => e.name.startsWith('osi:'));
  if (entries.length > 100) performance.clearMeasures();
}
