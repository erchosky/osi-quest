import { setHTML } from '../components/dom-renderer.js';
import { mark, measure } from './performance.js';
import { bindStorageNotice } from '../components/storage-notice.js';
import { storyById } from '../data/progress-catalog.js';
import { installRoundControls } from './round-controls.js';
import { captureRoundLayout, stabilizeRound } from './round-layout.js';
import { pausedRoundView, activityErrorView } from '../features/play/round-controls.js';
import { createProgressRepository } from '../services/progress-repository.js';
import { createRouter } from './router.js';
import { renderTransition } from './screen-transition.js';
import { contextNotice, primaryNotice, syncNotices } from './notice-priority.js';
import { mountShell, updateShell, showSaved } from './shell.js';
import { resolveView, prefetchScreen } from './routes.js';
import { drawLayerIllustration } from '../features/home/illustration.js';
import { showReward, clearReward } from './reward-feedback.js';
import { ActivityClock } from '../domain/activity-clock.js';
import { historicalAverage, buildRoundReport } from '../domain/round-report.js';
import { retryOptions } from '../domain/retry-options.js';
import { installActivityTimers } from './activity-timers.js';

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createApplication() {
  const app = {
    repository: createProgressRepository(browserStorage(), {
      onReward: showReward,
      onSave: showSaved,
      onStatusChange: () => {
        const slot = document.querySelector('#storage-status');
        if (slot) {
          setHTML(slot, primaryNotice(app));
          bindStorageNotice(app);
          syncNotices(app);
        }
      },
    }),
    prefetchScreen,
    activity: null,
    profileDifficulty: 'all',
    clockShift: 0,
    now() {
      return performance.now() + app.clockShift;
    },
    exploration: { labStep: 0, journeyStep: 0, readingFocus: false },
    announce(message) {
      const announcer = document.querySelector('#announcer');
      if (announcer) announcer.textContent = message;
    },
    async startActivity(kind, options = {}) {
      if (app.launching) return;
      if (app.hasOpenRound() && (await app.requestRoundExit('play')) !== 'exit') return;
      mark('session:start');
      app.launching = true;
      const launchNavigation = app.navigationRevision;
      const launchHash = location.hash;
      let session;
      try {
        const { createSession } = await import('../features/play/session-factory.js');
        if (app.navigationRevision !== launchNavigation || location.hash !== launchHash) {
          app.launching = false;
          return;
        }
        session = createSession(kind, { ...options, now: app.now }, app.repository.data);
      } catch (error) {
        if (app.navigationRevision !== launchNavigation || location.hash !== launchHash) {
          app.launching = false;
          return;
        }
        app.activityError = error.message || 'Prueba otra actividad o vuelve a cargar la app.';
        app.router.navigate('play/error');
        app.launching = false;
        return;
      }
      app.launching = false;
      if (
        !options.challenge &&
        !options.practiceOnly &&
        !options.recovery &&
        !options.retry &&
        kind !== 'story'
      )
        app.repository.rememberActivity(kind, options);
      clearReward();
      app.activityError = null;
      app.roundPaused = false;
      if (
        !['cases', 'flashcards', 'duel', 'confusions', 'story'].includes(kind) &&
        !options.practiceOnly &&
        !options.challenge
      )
        app.repository.setDifficulty(options.difficulty);
      measure('session:create', 'session:start');
      app.activity = session;
      session.challenge = options.challenge ?? null;
      session.launchOptions = { ...options };
      session.baseline =
        session.practiceOnly || session.recovery
          ? { rounds: 0, percent: null }
          : historicalAverage(app.repository.data.history, {
              kind,
              difficulty: session.difficulty,
              timed: Boolean(session.timed),
              retry: Boolean(session.retry),
              challengeCode: options.challenge?.code,
              caseId: session.caseStudy?.id ?? null,
              direction: session.direction ?? null,
              chapterId: session.storyChapter?.id ?? null,
              focusLayer: session.focusLayer ?? null,
            });
      app.roundClock?.stop();
      app.roundClock = new ActivityClock(app.now);
      app.syncUnloadGuard();
      app.requestedRoute = 'play/run';
      app.router.navigate('play/run');
    },
    startStoryChapter(id) {
      const chapter = storyById.get(id);
      if (!chapter) return;
      const practiceOnly = app.repository.data.story.completed.includes(id);
      const recent = chapter.questions.some(
        (question) => Date.now() - (app.repository.data.stats[question.id]?.last ?? 0) < 600000,
      );
      app.startActivity('story', {
        difficulty: 'normal',
        chapterId: id,
        practiceOnly,
        recovery: !practiceOnly && recent,
      });
    },
    recordAnswers(outcomes, kind) {
      if (!app.activity.practiceOnly) app.repository.recordAnswers(outcomes, kind);
    },
    recordAnswer(outcome, kind) {
      if (app.activity.type === 'survival' && !outcome.correct)
        app.announce(
          `${outcome.timedOut ? 'Se acabó el tiempo.' : 'Respuesta para repasar.'} Te quedan ${app.activity.lives} vidas.`,
        );
      app.activity.recentBadge = app.activity.practiceOnly
        ? null
        : app.repository.recordAnswer(outcome, kind);
    },
    completeRound() {
      const session = app.activity;
      if (!session?.done || session.finalReport) return session?.finalReport;
      const duration = app.roundClock?.stop() ?? 0;
      if (!session.result) return null;
      app.syncUnloadGuard();
      session.finalReport = buildRoundReport(session, duration, session.baseline);
      if (!session.practiceOnly) {
        app.repository.recordRound(session.finalReport);
        if (session.kind === 'story')
          session.storyCompletion = {
            passed: app.repository.completeChapter(session.storyChapter.id, session.finalReport),
          };
      }
      return session.finalReport;
    },
    repeatMistakes(playerIndex) {
      const retry = retryOptions(app.activity, playerIndex);
      if (retry) app.startActivity(retry.kind, retry.options);
    },
    refresh() {
      return app.router.refresh();
    },
  };
  app.profileDifficulty = app.repository.data.radarLevel;
  mountShell();
  installActivityTimers(app);
  installRoundControls(app);
  let renderRevision = 0;
  app.router = createRouter(
    async (route, navigated) => {
      mark('route:start');
      const revision = ++renderRevision;
      if (navigated) app.navigationRevision = (app.navigationRevision ?? 0) + 1;
      app.requestedRoute = route.join('/');
      const previous = captureRoundLayout(app, route);
      if (app.activity?.done) app.completeRound();
      const routeName = route.join('/');
      const inRound = routeName === 'play/run';
      let view =
        inRound && app.roundPaused
          ? pausedRoundView()
          : routeName === 'play/error'
            ? activityErrorView(app.activityError ?? 'Elige otra actividad.')
            : resolveView(app, route);
      const loading = document.querySelector('#screen-loading');
      if (view?.then) {
        loading.hidden = false;
        document.querySelector('#main').setAttribute('aria-busy', 'true');
        try {
          view = await view;
        } catch {
          view = {
            section: 'home',
            title: 'No se pudo abrir',
            html: '<section class="panel empty-state"><h1>No se pudo abrir esta pantalla.</h1><p>Comprueba la conexión con la app y vuelve a intentarlo. Tu progreso guardado sigue disponible.</p><button class="button button-primary" id="retry-screen">Volver a cargar la app</button><a class="button" href="#/home">Ir al inicio</a></section>',
            bind: () =>
              document
                .querySelector('#retry-screen')
                .addEventListener('click', () => location.reload()),
          };
        }
      }
      if (revision !== renderRevision) return;
      const commit = () => {
        if (revision !== renderRevision) return;
        loading.hidden = true;
        app.currentRoute = routeName;
        app.viewCleanup?.();
        app.viewCleanup = null;
        if (app.activity?.type === 'survival' && app.activity.timed && !app.activity.currentAnswer)
          clearReward();
        document.body.classList.toggle(
          'reading-focus',
          route[0] === 'study' && Boolean(route[1]) && app.exploration.readingFocus,
        );
        document.title = `${view.title || { home: 'Inicio', study: 'Estudiar', play: 'Jugar', explore: 'Explorar', progress: 'Mi progreso' }[view.section]} · OSI Quest`;
        updateShell(view.section, app.repository.data, view.title);
        const main = document.querySelector('#main');
        main.removeAttribute('aria-busy');
        setHTML(
          main,
          `<div id="storage-status">${primaryNotice(app)}</div><div id="context-notice">${contextNotice(app, inRound)}</div>` +
            view.html,
        );
        syncNotices(app);
        const cleanup = view.bind?.();
        if (typeof cleanup === 'function') app.viewCleanup = cleanup;
        bindStorageNotice(app);
        app.bindRoundControls();
        app.syncUnloadGuard();
        measure('route:render', 'route:start');
        drawLayerIllustration();
        app.updateActivityClocks();
        document.body.classList.toggle('round-active', inRound && app.hasOpenRound());
        stabilizeRound(app, previous);
        if (navigated) {
          window.scrollTo({ top: 0, behavior: 'instant' });
          main.focus({ preventScroll: true });
        }
      };
      await renderTransition(commit, navigated && !inRound && !app.hasOpenRound());
    },
    { beforeNavigate: (route) => app.beforeNavigate(route) },
  );
  app.router.start();
  return app;
}
