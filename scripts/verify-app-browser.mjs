const { chromium } = await import(process.env.OSI_PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { serializeProgress } from '../src/services/progress-integrity.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { questions } from '../src/data/questions/index.js';
import { units } from '../src/data/units.js';
import { lessonContent } from '../src/features/study/content.js';

const base = process.env.OSI_TEST_URL || 'http://127.0.0.1:5173/';
const directory = new URL('../work/browser-app/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const checks = [];
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('response', (response) => {
  if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
});
await page.goto(base);
await page.evaluate(() =>
  localStorage.setItem(
    'osi-quest-v1',
    JSON.stringify({ version: 2, xp: 20, read: ['basics'], stats: {}, cards: {} }),
  ),
);
await page.reload();
await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('osi-quest-v1')));
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
  await page.evaluate((value) => {
    location.hash = `/${value}`;
  }, path);
  await page.waitForFunction(
    (value) => JSON.parse(window.render_game_to_text()).route === value,
    path,
  );
  await page.locator('h1').first().waitFor();
}
async function shot(name) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: new URL(`${name}.png`, directory).pathname, fullPage: true });
}
function check(label, condition = true) {
  assert.ok(condition, label);
  checks.push(label);
}
async function start(kind, difficulty = 'normal', extra = {}) {
  await route(`setup/${kind}`);
  if (await page.locator('[name=difficulty]').count())
    await page.locator(`[name=difficulty][value=${difficulty}]`).check();
  for (const [key, value] of Object.entries(extra))
    await page.locator(`[name=${key}][value=${value}]`).check();
  await page.locator('#setup-form button[type=submit]').click();
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).route === 'play/run');
}
async function finishQuiz({ hint = false, wrong = false } = {}) {
  let count = 0;
  while (!(await state()).activity.done) {
    const current = (await state()).activity;
    const question = questions.find((item) => item.id === current.questionId);
    if (hint && count === 0) await page.locator('#hint-button').click();
    const selected =
      wrong && count === 0
        ? current.options.find((option) => option.index !== question.correctIndex).index
        : question.correctIndex;
    await page.locator(`[data-choice="${selected}"]`).click();
    check('Answer produces explanatory feedback', (await page.locator('.feedback').count()) === 1);
    await page.locator('#next-question').click();
    count++;
  }
  return count;
}

try {
  check(
    'Migrates previous progress on the same origin',
    (await state()).xp === 20 && (await state()).read.includes('basics'),
  );
  await shot('inicio');
  await route('play');
  check(
    'Fifteen distinct selectable activities',
    (await page.locator('.activity-card').count()) === 15,
  );
  await shot('actividades');
  await route('setup/function');
  await shot('elegir-dificultad');

  for (const direction of ['receive', 'send']) {
    await start('order', direction === 'send' ? 'hard' : 'normal', { direction });
    const before = (await state()).xp;
    const sequence = direction === 'send' ? [7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7];
    if (direction === 'receive') {
      await page.locator('[data-layer="7"]').click();
      check('Wrong order choice does not advance', (await state()).activity.built.length === 0);
      await page.locator('#order-hint').click();
      await shot('orden-con-pista');
    }
    for (const number of sequence) await page.locator(`[data-layer="${number}"]`).click();
    check(`Order completes ${direction}`, (await state()).activity.done);
    check(
      `Order scores only independent steps ${direction}`,
      (await state()).xp - before === (direction === 'receive' ? 52 : 140),
    );
  }

  for (const difficulty of ['normal', 'hard']) {
    for (const kind of ['function', 'scenario', 'protocol', 'adaptive']) {
      await start(kind, difficulty);
      const activeId = (await state()).activity.questionId;
      if (difficulty === 'hard' && kind !== 'adaptive')
        check(
          `Hard ${kind} uses trap bank`,
          questions.find((question) => question.id === activeId).difficulty === 'hard',
        );
      if (kind === 'function') await shot(`pregunta-${difficulty}`);
      const total = await finishQuiz({
        hint: difficulty === 'normal' && kind === 'function',
        wrong: difficulty === 'normal' && kind === 'scenario',
      });
      check(
        `Round ${kind}/${difficulty} completes`,
        total === (kind === 'protocol' ? 8 : kind === 'adaptive' ? 10 : 7),
      );
    }
  }
  await shot('resultado');
  for (const caseId of ['cable', 'route', 'web']) {
    await start('cases', 'normal', { caseId });
    check('Case context is visible', (await page.locator('.case-context').count()) === 1);
    check(`Guided case ${caseId} completes`, (await finishQuiz()) === 3);
  }

  await start('exam');
  const examXp = (await state()).xp;
  await page.locator('#flag-question').click();
  const firstId = (await state()).activity.questionId;
  const first = questions.find((question) => question.id === firstId);
  const wrongOption = (await state()).activity.options.find(
    (option) => option.index !== first.correctIndex,
  ).index;
  await page.locator(`[data-choice="${wrongOption}"]`).click();
  check(
    'Exam hides explanations and XP until submission',
    (await page.locator('.feedback').count()) === 0 && (await state()).xp === examXp,
  );
  await page.locator('#next-question').click();
  await page.locator('[data-jump="0"]').click();
  check(
    'Exam keeps flags and answers when revisiting',
    (await state()).activity.flagged.includes(firstId) &&
      (await page.locator('.is-selected').count()) === 1,
  );
  await page.locator(`[data-choice="${first.correctIndex}"]`).click();
  for (let index = 1; index < 15; index++) {
    await page.locator(`[data-jump="${index}"]`).click();
    const activeId = (await state()).activity.questionId;
    const question = questions.find((item) => item.id === activeId);
    await page.locator(`[data-choice="${question.correctIndex}"]`).click();
  }
  await page.locator('#next-question').click();
  await shot('revision-examen');
  check('Exam review shows all questions', (await page.locator('.exam-review-row').count()) === 15);
  await page.locator('#submit-exam').click();
  check('Correct exam awards exactly 120 XP', (await state()).xp === examXp + 120);
  check(
    'Exam correction exposes all explanations',
    (await page.locator('.review-card').count()) === 15,
  );
  await page.locator('.review-card summary').first().click();
  await shot('correccion-examen');

  await start('exam', 'hard');
  const blankXp = (await state()).xp;
  await page.locator('[data-jump="14"]').click();
  await page.locator('#next-question').click();
  await page.locator('#submit-exam').click();
  await page.locator('[data-dialog=cancel]').click();
  check('Blank exam confirmation can be canceled', !(await state()).activity.done);
  await page.locator('#submit-exam').click();
  await page.locator('[data-dialog=confirm]').click();
  check(
    'Unanswered exam records zero correct and no XP',
    (await state()).xp === blankXp && (await stored()).history.at(-1).correct === 0,
  );

  await start('flashcards');
  check(
    'Cards hide the answer before recall',
    (await page.locator('.flashcard-answer').count()) === 0,
  );
  const cardId = (await state()).activity.cardId;
  await page.locator('#reveal-card').click();
  await shot('tarjeta');
  await page.locator('[data-rate=known]').click();
  check('Known card is scheduled in the future', (await stored()).cards[cardId].due > Date.now());
  const againId = (await state()).activity.cardId;
  await page.locator('#reveal-card').click();
  await page.locator('[data-rate=again]').click();
  check('Unknown card stays due', (await stored()).cards[againId].due <= Date.now());
  while (!(await state()).activity.done) {
    await page.locator('#reveal-card').click();
    await page.locator('[data-rate=known]').click();
  }
  check(
    'All cards complete and a voluntary early review remains available',
    (await page.locator('h1').innerText()) === 'Recordar es volver a conectar.',
  );

  for (const unit of units) {
    await route(`study/${unit.id}`);
    check(
      `Lesson ${unit.id} has explanatory sections`,
      (await page.locator('.lesson-section').count()) >= 3,
    );
    await page.locator(`[data-check="${lessonContent(unit).check.correctIndex}"]`).click();
    check(
      'Lesson check explains answer',
      (await page.locator('#lesson-feedback .feedback-correct').count()) === 1,
    );
    if (unit.id === 'layer-4') await shot('estudio');
    await page.locator('#complete-lesson').click();
  }
  await page.locator('#reading-focus').click();
  check(
    'Reading mode hides navigation',
    !(await page.locator('.app-sidebar').isVisible()) &&
      !(await page.locator('.lesson-nav').isVisible()),
  );
  await shot('lectura');
  await page.locator('#reading-focus').click();
  check('Reading mode restores navigation', await page.locator('.app-sidebar').isVisible());
  check('All eighteen lessons saved', (await stored()).read.length === units.length);

  await route('explore/lab');
  for (let i = 0; i < 4; i++) await page.locator('#wrap').click();
  check(
    'Lab reaches signals and stops',
    (await state()).exploration.labStep === 4 && (await page.locator('#wrap').isDisabled()),
  );
  await page.locator('[data-step="3"]').click();
  await shot('laboratorio');
  check(
    'Ethernet view shows four nested envelopes',
    (await page.locator('.envelope').count()) === 4,
  );
  for (let i = 0; i < 3; i++) await page.locator('#unwrap').click();
  check(
    'Lab returns to unwrapped data',
    (await state()).exploration.labStep === 0 && (await page.locator('#unwrap').isDisabled()),
  );
  await route('explore/journey');
  for (let i = 0; i < 13; i++) await page.locator('#journey-next').click();
  check('Journey reaches application at receiver', (await state()).exploration.journeyStep === 13);
  await shot('viaje');
  await page.locator('#journey-next').click();
  check('Journey resets cleanly', (await state()).exploration.journeyStep === 0);
  await route('explore/glossary');
  await page.locator('#glossary-search').fill('fisica');
  await page.waitForFunction(
    () => document.querySelector('#glossary-count').textContent !== '40 términos',
  );
  check('Glossary search ignores accents', (await page.locator('.glossary-term').count()) > 0);
  await page.locator('#glossary-search').fill('zzzzzz');
  await page.waitForSelector('#glossary-results .notice');
  check(
    'Glossary empty state appears',
    (await page.locator('#glossary-results .notice').count()) === 1,
  );
  await page.locator('#glossary-search').fill('');
  await page.waitForSelector('#glossary-results .glossary-term');
  check('Glossary restores 28 terms', (await page.locator('.glossary-term').count()) === 28);
  await page.locator('#glossary-search').focus();
  await page.keyboard.press('Shift+F');
  check(
    'Typing f in search does not toggle fullscreen',
    await page.evaluate(() => !document.fullscreenElement),
  );

  await route('progress');
  await shot('progreso');
  const xp = (await state()).xp;
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  check('Progress survives reload', (await state()).xp === xp);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-progress').click();
  const download = await downloadPromise;
  check(
    'Backup download has expected name',
    download.suggestedFilename() === 'osi-quest-progreso.json',
  );
  await download.saveAs(new URL('progreso-exportado.json', directory).pathname);
  const { integrity, ...originalBackup } = await stored();
  const backup = { ...originalBackup, xp: 321 };
  const payload = {
    name: 'copia.json',
    mimeType: 'application/json',
    buffer: Buffer.from(serializeProgress(backup)),
  };
  await page.locator('#import-progress').setInputFiles(payload);
  await page.locator('[data-dialog=cancel]').click();
  check('Import cancellation preserves progress', (await state()).xp === xp);
  await page.locator('#import-progress').setInputFiles(payload);
  await page.locator('[data-dialog=confirm]').click();
  check('Valid backup restores progress', (await state()).xp === 321);
  await page
    .locator('#import-progress')
    .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await page.waitForFunction(() =>
    document.querySelector('#backup-status').textContent.includes('copia de progreso'),
  );
  check(
    'Invalid backup is rejected without changing progress',
    (await page.locator('#backup-status').innerText()).includes('copia de progreso') &&
      (await state()).xp === 321,
  );
  await page.locator('#reset-progress').click();
  await page.locator('[data-dialog=cancel]').click();
  check('Reset cancellation preserves progress', (await state()).xp === 321);
  await page.locator('#reset-progress').click();
  await page.locator('[data-dialog=confirm]').click();
  check(
    'Confirmed reset clears only this browser progress',
    (await state()).xp === 0 && (await state()).read.length === 0,
  );

  await route('home');
  await page.keyboard.press('Shift+F');
  await page.waitForFunction(() => Boolean(document.fullscreenElement));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.fullscreenElement);
  check('Fullscreen toggles with Shift+F and Escape');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    'home',
    'play',
    'setup/function',
    'study',
    'study/layer-4',
    'explore',
    'explore/lab',
    'explore/journey',
    'explore/glossary',
    'progress',
  ]) {
    await route(path);
    check(
      `Mobile ${path} has no horizontal overflow`,
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    );
    check(`Mobile ${path} navigation remains visible`, await page.locator('.main-nav').isVisible());
    if (['home', 'play', 'study/layer-4'].includes(path))
      await shot(`movil-${path.replaceAll('/', '-')}`);
  }
  await start('function', 'hard');
  await shot('movil-reto');
  check('Mobile answers are fully visible', await page.locator('.answer').first().isVisible());
  await route('not-a-route');
  check(
    'Unknown routes have a usable recovery screen',
    (await page.locator('h1').innerText()).includes('Por aquí'),
  );
  console.log('Browser diagnostics', errors);
  check('No console, script or HTTP errors', errors.length === 0);
  await writeFile(
    new URL('report.json', directory),
    JSON.stringify({ base, checks: checks.length, errors, labels: checks }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length, errors, screenshots: directory.pathname }));
} finally {
  await browser.close();
}
