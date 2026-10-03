export function historicalAverage(
  history,
  {
    kind,
    difficulty,
    timed = false,
    retry = false,
    challengeCode,
    caseId = null,
    direction = null,
    chapterId = null,
    focusLayer = null,
  },
) {
  const previous = history.filter(
    (item) =>
      item.mode === kind &&
      item.difficulty === difficulty &&
      Boolean(item.timed) === timed &&
      Boolean(item.retry) === retry &&
      (item.challengeCode ?? null) === (challengeCode ?? null) &&
      (item.caseId ?? null) === caseId &&
      (item.direction ?? null) === direction &&
      (item.chapterId ?? null) === chapterId &&
      (item.focusLayer ?? null) === focusLayer &&
      !item.recovery &&
      item.total > 0,
  );
  return {
    rounds: previous.length,
    percent: previous.length
      ? previous.reduce((sum, item) => sum + (item.correct / item.total) * 100, 0) / previous.length
      : null,
  };
}

export function layerFailures(outcomes = []) {
  const groups = new Map();
  for (const outcome of outcomes) {
    if (outcome.correct && !outcome.assisted) continue;
    const layer = outcome.question?.layer ?? outcome.layer ?? 0;
    const group = groups.get(layer) ?? { layer, wrong: 0, assisted: 0, unanswered: 0, timedOut: 0 };
    if (outcome.errors) group.wrong += outcome.errors;
    if (outcome.timedOut) group.timedOut++;
    else if (outcome.correct && outcome.assisted) {
      if (!outcome.errors || outcome.hintUsed) group.assisted++;
    } else if (outcome.selected === null) group.unanswered++;
    else group.wrong++;
    groups.set(layer, group);
  }
  return [...groups.values()].sort((a, b) => a.layer - b.layer);
}

export function buildRoundReport(session, durationMs, baseline) {
  const result = session.result;
  return {
    ...result,
    durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : null,
    baseline,
    failures: layerFailures(result.outcomes),
    timed: Boolean(session.timed),
    retry: Boolean(session.retry),
    recovery: Boolean(session.recovery),
    challengeCode: session.challenge?.code ?? null,
    direction: session.direction ?? null,
    chapterId: session.storyChapter?.id ?? null,
    focusLayer: session.focusLayer ?? null,
    caseId: session.caseStudy?.id ?? null,
  };
}

export function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return 'Sin tiempo registrado';
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 1) return 'Menos de 1 s';
  if (seconds < 60) return `${seconds} s`;
  return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`;
}
