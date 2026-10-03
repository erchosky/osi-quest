const { chromium } = await import(process.env.OSI_PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { learningQuestions } from '../src/data/questions/index.js';
import { storyChapters } from '../src/data/story.js';
import { createChallenge } from '../src/domain/class-challenge.js';
const base = process.env.OSI_TEST_URL || 'http://127.0.0.1:5173/';
const directory = new URL('../work/browser-story/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  const start = window.setInterval.bind(window),
    stop = window.clearInterval.bind(window);
  window.activeGameIntervals = new Set();
  window.setInterval = (...args) => {
    const id = start(...args);
    window.activeGameIntervals.add(id);
    return id;
  };
  window.clearInterval = (id) => {
    window.activeGameIntervals.delete(id);
    stop(id);
  };
});
const page = await context.newPage(),
  errors = [],
  checks = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`);
});
const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('osi-quest-v1')));
function check(label, value = true) {
  assert.ok(value, label);
  checks.push(label);
}
async function waitRoute(path) {
  await page.waitForFunction(
    (path) => JSON.parse(window.render_game_to_text()).route === path,
    path,
  );
}
async function route(path) {
  const before = await state();
  if (
    before.route === 'play/run' &&
    before.activity &&
    !before.activity.done &&
    !before.roundPaused &&
    path !== 'play/run'
  ) {
    await page.locator('[data-round-close]').click();
    await page.locator('[data-round-action=exit]').click();
    await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).route !== 'play/run');
  }
  await page.evaluate((path) => {
    location.hash = `/${path}`;
  }, path);
  await waitRoute(path);
}
async function start(kind, difficulty = 'normal', timed = false) {
  await route(`setup/${kind}`);
  if (await page.locator('[name=difficulty]').count())
    await page.locator(`[name=difficulty][value=${difficulty}]`).check();
  if (timed) await page.locator('[name=timed]').check();
  await page.locator('#setup-form button[type=submit]').click();
  await waitRoute('play/run');
}
async function answer(correct = true) {
  const current = (await state()).activity,
    q = learningQuestions.find((q) => q.id === current.questionId);
  await page
    .locator(
      `[data-choice="${correct ? q.correctIndex : current.options.find((o) => o.index !== q.correctIndex).index}"]`,
    )
    .click();
  return q;
}
async function finish() {
  while (!(await state()).activity.done) {
    await answer();
    await page.locator('#next-question').click();
  }
}
async function shot(name) {
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'auto' }));
  await page.screenshot({
    path: new URL(`${name}.png`, directory).pathname,
    fullPage: true,
    animations: 'disabled',
  });
}
const intervals = () => page.evaluate(() => window.activeGameIntervals.size);
const positions = () =>
  page.evaluate(() => ({
    answers: document.querySelector('.answer-list').getBoundingClientRect().top + scrollY,
    height: document.querySelector('.answer-list').getBoundingClientRect().height,
    title: document.querySelector('.question-title').getBoundingClientRect().height,
    scroll: scrollY,
  }));
try {
  await page.goto(base);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  check('No polling timer runs on home', (await intervals()) === 0);
  await route('story');
  check(
    'Story presents seven ordered chapter cards',
    (await page.locator('.story-chapter').count()) === 7,
  );
  check(
    'Only the first chapter starts unlocked',
    (await page.locator('.story-chapter:not(.is-locked)').count()) === 1,
  );
  check(
    'House network has seven selectable parts',
    (await page.locator('[data-network-part]').count()) === 7,
  );
  await page.locator('[data-network-part=dns]').click();
  check(
    'House part explains its future job',
    (await page.locator('#network-detail').innerText()).includes('Resuelve un nombre'),
  );
  await shot('historia-inicio');
  await route('story/dns');
  check(
    'A direct locked URL cannot bypass prerequisites',
    (await page.locator('h1').innerText()).includes('paso anterior'),
  );
  // Failure must not unlock the next chapter.
  await route('story/cable');
  await page.locator('#story-start').click();
  await waitRoute('play/run');
  for (let i = 0; i < 3; i++) {
    await answer(false);
    await page.locator('#next-question').click();
  }
  check(
    'Three failed decisions do not construct a chapter',
    (await stored()).story.completed.length === 0,
  );
  check(
    'Failed chapter result offers a useful repair path',
    (await page.locator('.story-result').innerText()).includes('dos decisiones'),
  );
  // Complete every chapter, including recovery of the first one.
  for (let i = 0; i < storyChapters.length; i++) {
    const chapter = storyChapters[i];
    await route(`story/${chapter.id}`);
    check(
      'Every chapter has everyday explanation and analogy',
      (await page.locator('.story-analogy').count()) === 1,
    );
    if (i === 2) await shot('capitulo-router');
    await page.locator('#story-start').click();
    await waitRoute('play/run');
    check('Story uses three guided decisions', (await state()).activity.total === 3);
    for (let step = 0; step < 3; step++) {
      check(
        'Correct layer stays hidden before response',
        (await page.locator('[data-revealed-layer]').count()) === 0,
      );
      const q = await answer();
      check(
        'Each decision reveals its exact layer',
        (await page.locator(`[data-revealed-layer="${q.layer}"]`).count()) === 1,
      );
      if (q.layer)
        check(
          'Only the corresponding minimap layer highlights',
          (await page.locator(`.mini-layer.is-active[data-mini-layer="${q.layer}"]`).count()) ===
            1 && (await page.locator('.mini-layer.is-active').count()) === 1,
        );
      if (i === 0 && step === 0) await shot('historia-respuesta');
      await page.locator('#next-question').click();
    }
    check(
      'Successful chapter constructs exactly the next piece',
      (await stored()).story.completed.length === i + 1,
    );
    check(
      'Chapter result replay leads back to its lesson',
      (await page.locator(`.result-hero a[href="#/story/${chapter.id}"]`).count()) === 1 &&
        (await page.locator('a[href="#/setup/story"]').count()) === 0,
    );
    await route('story');
    check(
      'Chapter completion visibly builds a new house part',
      (await page.locator('.network-part.is-built').count()) === i + 1,
    );
  }
  check(
    'All thirteen story activities unlock at the end',
    (await page.locator('.story-unlock.is-unlocked').count()) === 13,
  );
  await shot('casa-completa');
  const storyXP = (await state()).xp;
  await route('story/router');
  await page.locator('#story-start').click();
  await waitRoute('play/run');
  await finish();
  check('Replaying an already built chapter does not farm XP', (await state()).xp === storyXP);
  await route('story');
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  check(
    'Built house and chapter unlocks survive reload',
    (await stored()).story.completed.length === 7 &&
      (await page.locator('.network-part.is-built').count()) === 7,
  );
  check('Reading story keeps all recurring game timers stopped', (await intervals()) === 0);

  await start('function', 'hard');
  check(
    'Quiz replaces the round bar with seven points',
    (await page.locator('.round-dot').count()) === 7 &&
      (await page.locator('.game-panel > .progress-track').count()) === 0,
  );
  await page.evaluate(() => scrollTo(0, 300));
  const first = await positions();
  await answer(false);
  await page.locator('#next-question').click();
  const second = await positions();
  check(
    'Different question lengths preserve answer zone position',
    Math.abs(first.answers - second.answers) < 1 &&
      Math.abs(first.height - second.height) < 1 &&
      Math.abs(first.title - second.title) < 1,
  );
  check('Changing question preserves viewport scroll', Math.abs(first.scroll - second.scroll) < 1);
  check('Wrong answer remains as coral X', (await page.locator('.dot-wrong').count()) === 1);
  await page.locator('#hint-button').click();
  await answer();
  await page.locator('#next-question').click();
  check(
    'Hinted answer remains as amber half-circle',
    (await page.locator('.dot-assisted').count()) === 1,
  );
  await answer();
  await page.locator('#next-question').click();
  check(
    'Unaided success remains as green tick',
    (await page.locator('.dot-correct').count()) === 1,
  );
  await shot('puntos');
  // All three exit choices and native modal keyboard behavior.
  const activeId = (await state()).activity.questionId;
  await page.locator('[data-round-close]').click();
  check(
    'Close opens a bottom sheet with all three choices',
    (await page.locator('dialog.round-sheet[open] [data-round-action]').count()) === 3,
  );
  check(
    'Sheet initially focuses the safe continue action',
    await page
      .locator('[data-round-action=continue]')
      .evaluate((e) => document.activeElement === e),
  );
  await page.keyboard.press('a');
  check(
    'Answer shortcuts cannot affect a background round',
    (await state()).activity.answered === false,
  );
  await page.keyboard.press('Escape');
  check(
    'Escape continues without changing the question',
    (await state()).activity.questionId === activeId && !(await state()).roundSuspended,
  );
  await page.locator('[data-round-close]').click();
  await shot('panel-salida');
  await page.locator('[data-round-action=pause]').click();
  await waitRoute('play');
  check(
    'Pause retains round and exposes resume from the hub',
    (await state()).roundPaused && (await page.locator('[data-resume-round]').count()) === 1,
  );
  await page.locator('[data-resume-round]').click();
  await waitRoute('play/run');
  check(
    'Resuming restores question and previous points',
    (await state()).activity.questionId === activeId &&
      (await page.locator('.dot-wrong').count()) === 1,
  );
  // Sidebar and browser back are protected too.
  await page.locator('.main-nav [data-section=study]').click();
  await page.locator('dialog.round-sheet[open]').waitFor();
  check('Sidebar navigation cannot silently abandon', (await state()).route === 'play/run');
  await page.locator('[data-round-action=continue]').click();
  for (
    let step = 0;
    step < 4 && !(await page.locator('dialog.round-sheet[open]').count());
    step++
  ) {
    await page.goBack();
    await page.waitForTimeout(50);
  }
  await page.locator('dialog.round-sheet[open]').waitFor();
  check('Browser back is also protected', (await state()).route === 'play/run');
  await page.locator('[data-round-action=continue]').click();
  const xpBeforeExit = (await state()).xp,
    historyBeforeExit = (await stored()).history.length;
  await page.locator('[data-round-close]').click();
  await page.locator('[data-round-action=exit]').click();
  await waitRoute('play');
  check(
    'Discard removes temporary round and does not fabricate a result',
    !(await state()).activity && (await stored()).history.length === historyBeforeExit,
  );
  check(
    'Discard explains and preserves already saved practice XP',
    (await state()).xp === xpBeforeExit,
  );

  await start('exam');
  await answer(false);
  check(
    'Exam points remain neutral before submission',
    (await page.locator('.dot-answered').count()) === 1 &&
      (await page.locator('.dot-wrong,.dot-correct').count()) === 0 &&
      (await page.locator('[data-revealed-layer]').count()) === 0,
  );
  await page.locator('[data-round-close]').click();
  check(
    'Exam exit warns about unsubmitted answers',
    (await page.locator('#round-sheet-description').innerText()).includes('sin entregar'),
  );
  await page.locator('[data-round-action=exit]').click();
  await waitRoute('play');
  const challenge = createChallenge({ mode: 'FUN', difficulty: 'hard', seed: 'PREFERENCIA' });
  const preferred = (await state()).difficulty;
  await route(`class/${challenge.code}`);
  await page.locator('#class-start').click();
  await waitRoute('play/run');
  check(
    'Class challenge does not override personal difficulty',
    (await state()).difficulty === preferred,
  );
  await route('play');
  await start('survival', 'hard', true);
  check('Only a live timed question runs the pulse timer', (await intervals()) === 1);
  await page.locator('[data-round-close]').click();
  const beforePause = (await state()).activity.remainingMs;
  await page.evaluate(() => window.advanceTime(60000));
  check(
    'Open exit sheet suspends countdown',
    (await state()).activity.remainingMs === beforePause && (await intervals()) === 0,
  );
  await page.locator('[data-round-action=continue]').click();
  check('Continue restarts the single countdown interval', (await intervals()) === 1);
  await page.evaluate(() => window.advanceTime(20001));
  check(
    'Ten-second threshold has an accessible warning',
    (await page.locator('#announcer').innerText()).includes('diez segundos'),
  );
  await answer();
  check('Feedback stops background polling', (await intervals()) === 0);
  await page.locator('#next-question').click();
  const pausedQuestion = (await state()).activity;
  await page.locator('[data-round-close]').click();
  await page.locator('[data-round-action=pause]').click();
  await waitRoute('play');
  check('Hub after timed pause has no polling timer', (await intervals()) === 0);
  await page.evaluate(() => window.advanceTime(60000));
  await page.locator('[data-resume-round]').click();
  await waitRoute('play/run');
  check(
    'Timed pause preserves lives and unanswered question',
    (await state()).activity.lives === 3 &&
      (await state()).activity.questionId === pausedQuestion.questionId,
  );
  await route('play');
  await start('duel');
  await page.locator('[data-round-close]').click();
  check(
    'Duel handoff exit explains lost scoreboard',
    (await page.locator('#round-sheet-description').innerText()).includes('duelo'),
  );
  await page.locator('[data-round-action=continue]').click();
  await page.locator('#duel-ready').click();
  await answer();
  await page.locator('#duel-ready').click();
  check(
    'Duel point rows hide the first response before second answers',
    (await page.locator('.dot-correct,.dot-wrong').count()) === 0,
  );
  await answer(false);
  check(
    'Both point rows reveal only after both respond',
    (await page.locator('.dot-correct').count()) === 1 &&
      (await page.locator('.dot-wrong').count()) === 1,
  );

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['story', 'story/wifi', 'play']) {
      await route(path);
      check(
        `Story screen ${path} fits ${width}px`,
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      );
    }
    await start('function');
    await page.evaluate(() => scrollTo(0, 550));
    const initial = await positions();
    await answer();
    await page.locator('#next-question').scrollIntoViewIfNeeded();
    const before = await positions();
    await page.locator('#next-question').click();
    const after = await positions();
    check(
      `Mobile answer zone is stable at ${width}px`,
      Math.abs(initial.answers - after.answers) < 1 &&
        Math.abs(initial.height - after.height) < 1 &&
        Math.abs(before.scroll - after.scroll) <= 1,
    );
    await answer();
    check(
      `Minimap and layer tag fit ${width}px`,
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    );
    if (width === 390) await shot('movil-respuesta');
    await page.locator('[data-round-close]').click();
    check(
      `Sheet has all actions in reach at ${width}px`,
      await page.locator('[data-round-action=exit]').isVisible(),
    );
    if (width === 390) await shot('movil-panel');
    await page.locator('[data-round-action=exit]').click();
    await waitRoute('play');
    await route('story');
    if (width === 390) await shot('movil-historia');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start('function');
  await answer();
  await page.locator('#next-question').click();
  check(
    'Reduced-motion preference disables transition animations',
    await page.evaluate(
      () => document.querySelector('#main').getAnimations({ subtree: true }).length === 0,
    ),
  );
  await route('progress');
  await page.locator('[data-radar-level=hard]').click();
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  check(
    'Radar filter survives reload and remains accessible',
    (await page.locator('[data-radar-level=hard]').getAttribute('aria-pressed')) === 'true' &&
      (await stored()).radarLevel === 'hard',
  );
  await start('function');
  const pendingReload = page.reload().catch(() => null);
  const unload = await page.waitForEvent('dialog');
  check(
    'Reloading an unfinished round triggers the native warning',
    unload.type() === 'beforeunload',
  );
  await unload.dismiss();
  await pendingReload;
  check(
    'Cancelling reload keeps the unfinished round',
    (await state()).route === 'play/run' && !(await state()).activity.done,
  );
  check('No runtime, console or HTTP errors', errors.length === 0);
  await writeFile(
    new URL('report.json', directory),
    JSON.stringify({ base, checks: checks.length, errors, labels: checks }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length, errors, screenshots: directory.pathname }));
} finally {
  await browser.close();
}
