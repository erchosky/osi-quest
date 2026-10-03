export const RECOVERY_WAIT = 10 * 60 * 1000;
const targetKey = (session, outcome) =>
  outcome.question?.id ??
  (outcome.taskId
    ? `matching-${outcome.taskId}`
    : outcome.stageId
      ? `packet-${outcome.stageId}`
      : `order-${session.direction}-${outcome.layer}`);
/** An immediate replay is guided recovery, never new retrieval evidence. */
export function applyRecovery(session, progress, now = Date.now()) {
  session.recovery = true;
  if (session.type === 'flashcards') return session;
  for (const method of ['answer', 'pair', 'place']) {
    if (typeof session[method] !== 'function') continue;
    const original = session[method].bind(session);
    session[method] = (...args) => {
      const outcome = original(...args);
      if (outcome && typeof outcome.correct === 'boolean') {
        outcome.recovery = true;
        outcome.recoveryKey = targetKey(session, outcome);
        outcome.rewardBlocked = (progress.recoveryRewards?.[outcome.recoveryKey] ?? 0) > now;
        if (outcome.correct)
          outcome.xp =
            session.practiceOnly || outcome.rewardBlocked
              ? 0
              : session.difficulty === 'hard'
                ? 10
                : 4;
        if (session.feedback?.correct) session.feedback.xp = outcome.xp;
      }
      return outcome;
    };
  }
  return session;
}
