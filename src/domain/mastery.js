import { summarize } from './progress-metrics.js';
export function layerMastery(bank, stats, layer, difficulty = 'all') {
  const entries = bank
    .filter((question) => question.layer === layer)
    .map((question) => [
      question.id,
      difficulty === 'all' ? stats[question.id] : stats[question.id]?.levels?.[difficulty],
    ])
    .filter(([, stat]) => stat?.seen > 0);
  const summary = summarize(Object.fromEntries(entries));
  const coverage = Math.min(1, summary.unique / 4);
  return {
    ...summary,
    coverage,
    score: summary.attempts ? Math.round(summary.precision * coverage) : 0,
    limited: summary.unique < 4,
  };
}
