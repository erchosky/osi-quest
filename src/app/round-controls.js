import { showRoundSheet } from '../features/play/round-controls.js';
export function installRoundControls(app) {
  app.roundPaused = false;
  app.roundSuspended = false;
  app.hasOpenRound = () => Boolean(app.activity && !app.activity.done);
  app.abandonRound = () => {
    app.roundClock?.stop();
    app.activity?.setActive?.(false);
    app.activity = null;
    app.roundPaused = false;
    app.roundSuspended = false;
    app.updateActivityClocks();
    app.syncUnloadGuard();
  };
  app.resumeRound = () => {
    app.roundPaused = false;
    if (app.activity?.paused) app.activity.togglePause();
    app.requestedRoute = 'play/run';
    app.router.navigate('play/run');
  };
  app.requestRoundExit = async (destination = 'play') => {
    if (!app.hasOpenRound() || app.roundSuspended) return 'continue';
    app.roundSuspended = true;
    app.updateActivityClocks();
    const action = await showRoundSheet(app.activity);
    app.roundSuspended = false;
    if (action === 'exit') {
      app.abandonRound();
      app.router.navigate(destination);
    } else if (action === 'pause') {
      app.roundPaused = true;
      app.router.navigate(destination);
    }
    app.updateActivityClocks();
    return action;
  };
  app.beforeNavigate = (route) => {
    if (
      (app.currentRoute === 'play/run' || app.requestedRoute === 'play/run') &&
      route.join('/') !== 'play/run' &&
      app.hasOpenRound() &&
      !app.roundPaused
    ) {
      app.requestRoundExit(route.join('/'));
      return false;
    }
    return true;
  };
  app.bindRoundControls = () => {
    document
      .querySelectorAll('[data-round-close]')
      .forEach((button) =>
        button.addEventListener('click', () =>
          app.requestRoundExit(app.activity?.storyChapter ? 'story' : 'play'),
        ),
      );
    document
      .querySelectorAll('[data-resume-round]')
      .forEach((button) => button.addEventListener('click', app.resumeRound));
  };
  let guarding = false;
  function onUnload(event) {
    event.preventDefault();
    event.returnValue = '';
  }
  app.syncUnloadGuard = () => {
    const needed = app.hasOpenRound();
    if (needed === guarding) return;
    guarding = needed;
    if (needed) window.addEventListener('beforeunload', onUnload);
    else window.removeEventListener('beforeunload', onUnload);
  };
}
