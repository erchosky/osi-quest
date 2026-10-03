// Observable game state without answer keys; deterministic time stepping is scoped to the clock.
export function installTestingHooks(app) {
  window.render_game_to_text = () => {
    const session = app.activity;
    const state = {
      route: app.currentRoute,
      coordinates: 'DOM interface; no spatial game coordinates',
      xp: app.repository.data.xp,
      read: app.repository.data.read,
      difficulty: app.repository.data.difficulty,
      story: app.repository.data.story,
      roundPaused: app.roundPaused,
      roundSuspended: app.roundSuspended,
      exploration: app.exploration,
    };
    if (state.route === 'play/run' && session) {
      state.activity = { type: session.type, kind: session.kind, done: session.done };
      if (session.challenge) state.activity.challengeCode = session.challenge.code;
      if (session.type === 'quiz' || session.type === 'survival' || session.type === 'speedrun')
        Object.assign(state.activity, {
          index: session.index,
          total: session.questions.length,
          questionId: session.current?.id,
          prompt: session.current?.prompt,
          answered: Boolean(session.currentAnswer),
          options: session.options[session.index].map((index) => ({
            index,
            text: session.current.choices[index],
          })),
          flagged: [...session.flags],
          reviewing: session.reviewing,
        });
      if (session.type === 'survival')
        Object.assign(state.activity, {
          lives: session.lives,
          timed: session.timed,
          remainingMs: Math.ceil(session.remainingMs),
          paused: session.paused,
        });
      if (session.type === 'speedrun')
        Object.assign(state.activity, {
          remainingMs: Math.ceil(session.remainingMs),
          chain: session.chain,
          bestChain: session.bestChain,
        });
      if (session.focusLayer) state.activity.focusLayer = session.focusLayer;
      if (session.type === 'duel')
        Object.assign(state.activity, {
          phase: session.phase,
          playerIndex: session.playerIndex,
          names: session.names,
          index: session.index,
          total: session.questions.length,
          ...(session.phase === 'handoff'
            ? {}
            : {
                questionId: session.current.id,
                prompt: session.current.prompt,
                options: session.options.map((index) => ({
                  index,
                  text: session.current.choices[index],
                })),
              }),
        });
      if (session.type === 'order')
        Object.assign(state.activity, { direction: session.direction, built: session.built });
      if (session.type === 'matching') Object.assign(state.activity, session.summary);
      if (session.type === 'packet')
        Object.assign(state.activity, {
          index: session.index,
          total: session.missions.length,
          missionId: session.current.id,
          selected: session.selected,
          placed: session.placed,
          placements: session.placements,
          choices: session.choices.map((choice) => ({ id: choice.id, text: choice.label })),
        });
      if (session.type === 'flashcards')
        Object.assign(state.activity, {
          index: session.index,
          total: session.cards.length,
          cardId: session.current?.id,
          revealed: session.revealed,
        });
    }
    return JSON.stringify(state);
  };
  // Deterministic time stepping for the optional survival countdown.
  window.advanceTime = async (milliseconds = 0) => {
    if (
      app.currentRoute !== 'play/run' ||
      !['survival', 'speedrun'].includes(app.activity?.type) ||
      !app.activity.timed
    )
      return;
    app.clockShift += Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0;
    app.pulseTimers();
  };
}
