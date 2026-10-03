export function installActivityTimers(app) {
  let interval = null;
  let warnedQuestion = null;
  function visible() {
    return (
      app.currentRoute === 'play/run' &&
      !document.hidden &&
      app.activity &&
      !app.activity.done &&
      !app.roundPaused &&
      !app.roundSuspended
    );
  }
  function active() {
    const session = app.activity,
      shown = Boolean(visible());
    app.roundClock?.setActive(Boolean(shown && !session.paused && session.phase !== 'handoff'));
    session?.setActive?.(shown);
    const ticking =
      shown &&
      (session.type === 'speedrun' ||
        (session.type === 'survival' &&
          session.timed &&
          !session.paused &&
          !session.currentAnswer));
    if (ticking && interval === null) interval = window.setInterval(pulse, 200);
    if (!ticking && interval !== null) {
      window.clearInterval(interval);
      interval = null;
    }
  }
  function pulse() {
    active();
    const session = app.activity;
    if (visible() && session.type === 'speedrun') {
      if (session.tick()) {
        app.completeRound();
        app.refresh();
        app.announce('Se acabó el sprint. Revisa tus respuestas.');
        return;
      }
      const output = document.querySelector('#speedrun-time');
      if (output) {
        output.textContent = `${Math.ceil(session.remainingMs / 1000)} s`;
        output.classList.toggle('is-urgent', session.remainingMs <= 10000);
      }
      return;
    }
    if (!visible() || session.type !== 'survival' || !session.timed || session.paused) return;
    const outcome = session.tick();
    if (outcome) {
      app.recordAnswer(outcome, session.kind);
      app.refresh();
      document.querySelector('#next-question')?.focus({ preventScroll: true });
    }
    const timer = document.querySelector('#survival-time');
    if (timer) {
      timer.textContent = `${Math.ceil(session.remainingMs / 1000)} s`;
      timer.classList.toggle('is-urgent', session.remainingMs <= 10000);
    }
    if (
      !session.currentAnswer &&
      session.remainingMs <= 10000 &&
      warnedQuestion !== session.current.id
    ) {
      warnedQuestion = session.current.id;
      app.announce('Quedan diez segundos o menos para esta pregunta.');
    }
  }
  app.updateActivityClocks = active;
  app.pulseTimers = pulse;
  document.addEventListener('visibilitychange', active);
}
