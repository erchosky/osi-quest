const DAY = 86_400_000;

export function recordQuestion(previous, correct, assisted, now = Date.now()) {
  const stat = previous ?? { seen: 0, correct: 0, streak: 0 };
  const independent = correct && !assisted;
  const streak = independent ? stat.streak + 1 : 0;
  const interval = streak === 0 ? 0 : streak === 1 ? 1 : streak === 2 ? 3 : 7;
  return {
    seen: stat.seen + 1,
    correct: stat.correct + Number(independent),
    streak,
    last: now,
    due: now + interval * DAY,
  };
}

export function scheduleCard(previous, known, now = Date.now()) {
  const level = known ? Math.min(4, (previous?.level ?? 0) + 1) : 0;
  return { level, due: now + [0, 1, 3, 7, 14][level] * DAY };
}

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
