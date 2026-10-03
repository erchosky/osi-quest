export function outcomeStatus(outcome) {
  if (!outcome) return 'pending';
  if (!outcome.correct) return 'wrong';
  return outcome.assisted || outcome.recovery ? 'assisted' : 'correct';
}
export function roundItems(session, playerIndex) {
  if (session.type === 'duel')
    return session.questions.map((question, index) => ({
      id: question.id,
      current: index === session.index,
      status:
        index < session.index ||
        session.done ||
        (index === session.index && session.phase === 'reveal')
          ? outcomeStatus(session.players[playerIndex].answers[question.id])
          : 'pending',
    }));
  let targets, getOutcome, current;
  if (session.questions) {
    targets = session.questions.map((q) => q.id);
    current = session.current?.id;
    getOutcome = (id) =>
      session.isExam && !session.done
        ? session.answers[id]
          ? { neutral: true }
          : null
        : session.answers[id];
  } else if (session.type === 'order') {
    targets = session.targets;
    current = session.expected;
    getOutcome = (id) => session.outcomes.find((o) => o.layer === id);
  } else if (session.type === 'packet') {
    targets = session.missions.map((m) => m.id);
    current = session.current.id;
    getOutcome = (id) => session.outcomes.find((o) => o.stageId === id);
  } else if (session.type === 'matching') {
    targets = session.cards.map((card) => card.id);
    current = session.selectedTask;
    getOutcome = (id) => session.outcomes.find((o) => o.taskId === id);
  } else {
    targets = session.cards.map((card) => card.id);
    current = session.current?.id;
    getOutcome = (id) => session.ratings.find((o) => o.cardId === id);
  }
  return targets.map((id) => {
    const outcome = getOutcome(id);
    return {
      id,
      current: !session.done && id === current,
      status: outcome?.neutral ? 'answered' : outcomeStatus(outcome),
    };
  });
}
