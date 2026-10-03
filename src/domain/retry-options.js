export function retryOptions(session, playerIndex) {
  const outcomes =
    playerIndex === undefined
      ? session.result.outcomes
      : session.result.players[playerIndex]?.outcomes;
  const mistakes = (outcomes ?? []).filter((outcome) => !outcome.correct || outcome.assisted);
  if (!mistakes.length) return null;
  const difficulty = session.difficulty;
  if (session.type === 'matching')
    return {
      kind: 'matching',
      options: { recovery: true, difficulty, taskIds: mistakes.map((outcome) => outcome.taskId) },
    };
  if (session.type === 'packet')
    return {
      kind: 'packet',
      options: { recovery: true, difficulty, stageIds: mistakes.map((outcome) => outcome.stageId) },
    };
  if (session.type === 'order')
    return {
      kind: 'order',
      options: {
        recovery: true,
        difficulty,
        direction: session.direction,
        targetLayers: mistakes.map((outcome) => outcome.layer),
      },
    };
  if (session.type === 'flashcards')
    return {
      kind: 'flashcards',
      options: { recovery: true, cardIds: mistakes.map((outcome) => outcome.cardId) },
    };
  return {
    kind: 'retry',
    options: {
      recovery: true,
      caseId: session.caseStudy?.id,
      chapterId: session.storyChapter?.id,
      difficulty,
      questionIds: mistakes.map((outcome) => outcome.question.id),
      practiceOnly: session.type === 'duel' || session.practiceOnly,
    },
  };
}
