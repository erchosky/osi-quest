import { reviewEvidence } from './review-evidence.js';
export function summarize(stats) {
  const values = Object.values(stats);
  const attempts = values.reduce((sum, value) => sum + value.seen, 0);
  const correct = values.reduce((sum, value) => sum + value.correct, 0);
  return {
    attempts,
    correct,
    unique: values.length,
    precision: attempts ? Math.round((correct / attempts) * 100) : null,
  };
}

export function summarizeLayer(bank, stats, layer) {
  const entries = bank
    .filter((question) => question.layer === layer)
    .map((question) => [question.id, stats[question.id]])
    .filter(([, value]) => value);
  return summarize(Object.fromEntries(entries));
}

export function dueCount(bank, stats, difficulty, now = Date.now()) {
  return bank.filter(
    (question) =>
      question.type !== 'case' &&
      (difficulty === 'hard' || question.difficulty === 'normal') &&
      reviewEvidence(stats[question.id], difficulty)?.due <= now,
  ).length;
}
