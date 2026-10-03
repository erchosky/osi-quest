export function recordConcept(previous, outcome, now = Date.now()) {
  const state = previous ?? {
    proofIds: [],
    earnedProofIds: [],
    earnedAt: null,
    needsReview: false,
    retryAfter: 0,
  };
  if (!outcome.correct || outcome.assisted)
    return {
      ...state,
      proofIds: [],
      needsReview: Boolean(state.earnedAt),
      retryAfter: now + 10 * 60 * 1000,
    };
  if (outcome.recovery || now < (state.retryAfter ?? 0)) return state;
  const proofIds = [...new Set([...state.proofIds, outcome.question.id])].slice(-2);
  const earns = proofIds.length === 2 && !state.earnedAt;
  return {
    proofIds,
    retryAfter: state.retryAfter ?? 0,
    earnedProofIds: earns ? [...proofIds] : state.earnedProofIds,
    earnedAt: earns ? now : state.earnedAt,
    needsReview: proofIds.length < 2 && state.needsReview,
  };
}
