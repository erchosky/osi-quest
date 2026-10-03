/** Legacy progress has no difficulty breakdown. Retain it for normal only. */
export function reviewEvidence(stat, difficulty) {
  if (!stat) return undefined;
  if (stat.levels?.[difficulty]) return stat.levels[difficulty];
  if (difficulty === 'normal' && !Object.keys(stat.levels ?? {}).length) return stat;
  return undefined;
}
