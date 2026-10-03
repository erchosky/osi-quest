const layouts = new WeakMap();
export function captureRoundLayout(app, route) {
  const same =
    route.join('/') === 'play/run' &&
    app.currentRoute === 'play/run' &&
    app.activity &&
    app.renderedRoundSession === app.activity;
  return same
    ? {
        session: app.activity,
        scroll: window.scrollY,
        key: app.renderedRoundKey,
        height: document.querySelector('#main').getBoundingClientRect().height,
      }
    : null;
}
export function stabilizeRound(app, previous) {
  const session = app.activity,
    main = document.querySelector('#main');
  if (app.currentRoute !== 'play/run' || !session || session.done || app.roundPaused) {
    main.style.minHeight = '';
    app.renderedRoundKey = null;
    app.renderedRoundSession = null;
    return;
  }
  const title = main.querySelector('.question-title'),
    answers = main.querySelector('.answer-list');
  if (title && answers && session.questions) {
    const width = Math.round(answers.getBoundingClientRect().width);
    let layout = layouts.get(session);
    if (!layout || layout.width !== width) {
      // Stack all texts in two invisible grids: one layout read per grid,
      // rather than forcing a layout for every title and every choice.
      const titleProbe = document.createElement('div');
      const answerProbe = document.createElement('div');
      const titleWidth = title.getBoundingClientRect().width;
      for (const [probe, probeWidth] of [
        [titleProbe, titleWidth],
        [answerProbe, width],
      ]) {
        probe.style.cssText = `position:fixed;left:-10000px;top:0;visibility:hidden;width:${probeWidth}px;display:grid;pointer-events:none`;
        probe.setAttribute('aria-hidden', 'true');
      }
      for (const question of session.questions) {
        const heading = title.cloneNode(false);
        heading.removeAttribute('id');
        heading.removeAttribute('tabindex');
        heading.style.cssText = 'grid-area:1/1;min-height:0;margin:0';
        heading.textContent = question.prompt;
        titleProbe.append(heading);
        for (const text of question.choices) {
          const button = answers.firstElementChild.cloneNode(true);
          button.removeAttribute('data-choice');
          button.removeAttribute('id');
          button.tabIndex = -1;
          button.style.cssText = 'grid-area:1/1;min-height:0';
          button.children[1].textContent = text;
          answerProbe.append(button);
        }
      }
      title.parentElement.append(titleProbe);
      answers.append(answerProbe);
      layout = {
        width,
        titleHeight: Math.ceil(titleProbe.getBoundingClientRect().height),
        answerHeight: Math.ceil(answerProbe.getBoundingClientRect().height),
      };
      titleProbe.remove();
      answerProbe.remove();
      layouts.set(session, layout);
    }
    title.style.minHeight = `${layout.titleHeight}px`;
    answers
      .querySelectorAll('.answer')
      .forEach((button) => (button.style.minHeight = `${layout.answerHeight}px`));
  }
  const key = `${session.index ?? session.built?.length ?? session.matched?.length}-${session.phase ?? ''}-${session.reviewing ?? ''}`;
  if (previous?.session === session) {
    // Preserve space while revealing one answer, never retain the tall previous explanation.
    const mainTop = main.getBoundingClientRect().top + window.scrollY;
    const footerHeight = document.querySelector('footer')?.getBoundingClientRect().height ?? 0;
    const viewportFloor = Math.max(0, previous.scroll + innerHeight - mainTop - footerHeight);
    main.style.minHeight = `${previous.key === key ? previous.height : viewportFloor}px`;
    window.scrollTo({ top: previous.scroll, behavior: 'instant' });
    if (previous.key !== key && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      main
        .querySelector('.game-panel,.flashcard-panel,.duel-handoff')
        ?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
  } else main.style.minHeight = '';
  app.renderedRoundKey = key;
  app.renderedRoundSession = session;
}
