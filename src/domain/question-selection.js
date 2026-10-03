import { reviewEvidence } from './review-evidence.js';
import { shuffle } from './random.js';

export function eligibleQuestions(bank, difficulty = 'normal') {
  return bank.filter(
    (question) =>
      question.type !== 'case' && (difficulty === 'hard' || question.difficulty === 'normal'),
  );
}

export function selectByLayer(bank, type, difficulty, random = Math.random) {
  const eligible = eligibleQuestions(bank, difficulty);
  return shuffle(
    Array.from({ length: 7 }, (_, index) => {
      const layer = index + 1;
      const normal = eligible.filter(
        (question) => question.layer === layer && question.type === type,
      );
      const hard = eligible.filter(
        (question) =>
          question.layer === layer && question.type === type && question.difficulty === 'hard',
      );
      return shuffle(difficulty === 'hard' && hard.length ? hard : normal, random)[0];
    }).filter(Boolean),
    random,
  );
}

export function selectExam(bank, difficulty, random = Math.random) {
  const eligible = eligibleQuestions(bank, difficulty);
  const coverage = Array.from({ length: 7 }, (_, index) => {
    const pool = eligible.filter((question) => question.layer === index + 1);
    const tricky = pool.filter((question) => question.difficulty === 'hard');
    return shuffle(difficulty === 'hard' && tricky.length ? tricky : pool, random)[0];
  }).filter(Boolean);
  const chosen = new Set(coverage.map((question) => question.id));
  const remaining = eligible.filter((question) => !chosen.has(question.id));
  const extra =
    difficulty === 'hard'
      ? [
          ...shuffle(
            remaining.filter((question) => question.difficulty === 'hard'),
            random,
          ),
          ...shuffle(
            remaining.filter((question) => question.difficulty === 'normal'),
            random,
          ),
        ]
      : shuffle(remaining, random);
  return shuffle([...coverage, ...extra.slice(0, 15 - coverage.length)], random);
}

export function selectAdaptive(bank, stats, difficulty, now = Date.now(), random = Math.random) {
  const pool = eligibleQuestions(bank, difficulty);
  const evidence = (question) => reviewEvidence(stats[question.id], difficulty);
  const due = shuffle(
    pool.filter((question) => evidence(question)?.due <= now),
    random,
  );
  const unseen = shuffle(
    pool.filter((question) => !evidence(question)),
    random,
  );
  const future = shuffle(
    pool.filter((question) => evidence(question)?.due > now),
    random,
  );
  return [...due, ...unseen, ...future].slice(0, 10);
}

export function selectProtocols(bank, difficulty, random = Math.random) {
  const pool = bank.filter(
    (question) => question.type === 'protocol' && question.difficulty === difficulty,
  );
  const coverage = Array.from(
    { length: 7 },
    (_, index) =>
      shuffle(
        pool.filter((question) => question.layer === index + 1),
        random,
      )[0],
  ).filter(Boolean);
  const chosen = new Set(coverage.map((question) => question.id));
  const extras = shuffle(
    pool.filter((question) => !chosen.has(question.id)),
    random,
  );
  return shuffle([...coverage, ...extras.slice(0, 8 - coverage.length)], random);
}
