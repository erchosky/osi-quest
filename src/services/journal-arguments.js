/** The journal stores results, never copies of the teaching content. Older entries still replay. */
export function journalArguments(method, args) {
  const answer = ({ question, ...outcome }) => ({
    ...outcome,
    question: { id: question.id, layer: question.layer },
  });
  if (method === 'recordAnswer') return [answer(args[0]), args[1]];
  if (method === 'recordAnswers') return [args[0].map(answer), args[1]];
  if (method === 'recordRound') {
    const { outcomes, questions, ...summary } = args[0];
    return [summary];
  }
  return args;
}
