export const REWARDS = Object.freeze({ normal: 8, hard: 20 });

/** One scoring rule for sessions, persistence and all visible reward labels. */
export function rewardXP(outcome, difficulty = outcome?.difficulty ?? 'normal') {
  if (!outcome?.correct || outcome.rewardBlocked) return 0;
  const base = REWARDS[difficulty] ?? REWARDS.normal;
  return outcome.assisted || outcome.recovery ? base / 2 : base;
}

export function levelProgress(xp) {
  const total = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  const current = total % 200;
  return { level: Math.floor(total / 200) + 1, current, target: 200, remaining: 200 - current };
}

export function independentStreak(outcomes) {
  let streak = 0;
  for (let index = outcomes.length - 1; index >= 0; index--) {
    if (!outcomes[index].correct || outcomes[index].assisted) break;
    streak++;
  }
  return streak;
}
