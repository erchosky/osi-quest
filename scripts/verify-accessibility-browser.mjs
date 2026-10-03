const { chromium } = await import(process.env.OSI_PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { learningQuestions } from '../src/data/questions/index.js';
import { matchingTasks } from '../src/data/matching.js';
const directory = new URL('../work/browser-accessibility/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const checks = [],
  errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
function check(label, value = true) {
  assert.ok(value, label);
  checks.push(label);
}
async function route(path) {
  const current = await state();
  if (current.route === 'play/run' && !current.activity.done && !current.roundPaused) {
    await page.locator('[data-round-close]').click();
    await page.locator('[data-round-action=exit]').click();
  }
  await page.evaluate((path) => (location.hash = `/${path}`), path);
  await page.waitForFunction(
    (path) => JSON.parse(window.render_game_to_text()).route === path,
    path,
  );
}
async function start(kind, difficulty = 'normal') {
  await route(`setup/${kind}`);
  if (await page.locator('[name=difficulty]').count())
    await page.locator(`[name=difficulty][value=${difficulty}]`).check();
  await page.locator('#setup-form [type=submit]').click();
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).route === 'play/run');
}
async function currentQuestion() {
  const id = (await state()).activity.questionId;
  return learningQuestions.find((question) => question.id === id);
}
async function capture(name) {
  await page.screenshot({
    path: new URL(`${name}.png`, directory).pathname,
    fullPage: true,
    animations: 'disabled',
  });
}
try {
  await page.goto(process.env.OSI_TEST_URL || 'http://127.0.0.1:5173/osi-quest/');
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  for (const width of [390, 320, 740]) {
    await page.setViewportSize({ width, height: 844 });
    await start('function');
    const q = await currentQuestion(),
      options = (await state()).activity.options;
    await page
      .locator(`[data-choice="${options.find((option) => option.index !== q.correctIndex).index}"]`)
      .click();
    check(
      `Wrong answer has visible symbol and text at ${width}px`,
      (await page.locator('.answer.is-wrong .answer-mark').innerText()) === '✗\nTu respuesta',
    );
    check(
      `Correct alternative is explicitly labelled at ${width}px`,
      (await page.locator('.answer.is-correct .answer-mark').innerText()).includes('Correcta'),
    );
    check(
      `Revealed alternatives remain enabled for focus at ${width}px`,
      (await page.locator('.answer[aria-disabled=true]:not(:disabled)').count()) === 4,
    );
    const before = await state();
    await page.locator('.answer.is-correct').evaluate((button) => button.click());
    await page.keyboard.press('a');
    check(
      `Repeat activation cannot change score or selected response at ${width}px`,
      (await state()).xp === before.xp && (await page.locator('.answer.is-wrong').count()) === 1,
    );
    for (let index = 0; index < 4; index++) {
      await page.locator('.answer').nth(index).focus();
      check(
        `Revealed alternative ${index + 1} can receive keyboard focus at ${width}px`,
        await page
          .locator('.answer')
          .nth(index)
          .evaluate((button) => button === document.activeElement),
      );
    }
    await page.locator('.answer').first().focus();
    await page.keyboard.press('Tab');
    check(
      `Tab reaches the next revealed alternative at ${width}px`,
      await page
        .locator('.answer')
        .nth(1)
        .evaluate((button) => button === document.activeElement),
    );
    const button = await page.locator('#next-question').boundingBox();
    const nav = await page.locator('.app-sidebar').boundingBox();
    check(
      `Next action is above bottom navigation at ${width}px`,
      button.y >= 0 && button.y + button.height <= (width <= 500 ? nav.y : 844),
    );
    await page.locator('#show-explanation').click();
    check(
      `Explanation shortcut moves focus to feedback at ${width}px`,
      await page
        .locator('#question-feedback')
        .evaluate((element) => document.activeElement === element),
    );
    const feedback = await page.locator('#question-feedback').boundingBox();
    check(
      `Explanation shortcut brings feedback into view at ${width}px`,
      feedback.y >= -1 && feedback.y < 650,
    );
    check(
      `Question fits viewport at ${width}px`,
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    );
    if (width === 390) {
      await capture('pregunta-movil-revisable');
      await page.screenshot({
        path: new URL('pregunta-movil-explicacion-viewport.png', directory).pathname,
        animations: 'disabled',
      });
    }
    await page.locator('#next-question').click();
    check(
      `Question transition is announced at ${width}px`,
      (await page.locator('#announcer').innerText()).includes('Pregunta 2'),
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await start('function');
  const right = await currentQuestion();
  await page.locator(`[data-choice="${right.correctIndex}"]`).click();
  const toast = await page.locator('#reward-toast').boundingBox(),
    next = await page.locator('#next-question').boundingBox();
  check(
    'Mobile XP notice stays in the header away from Next',
    toast.y + toast.height <= 60 && toast.y + toast.height < next.y,
  );
  await page.locator('#show-explanation').click();
  check(
    'Reading feedback retires XP visually without clearing its accessible message',
    await page
      .locator('#reward-toast')
      .evaluate(
        (element) =>
          getComputedStyle(element).opacity === '0' &&
          element.getAttribute('role') === 'status' &&
          !element.hidden &&
          element.textContent.trim().length > 0,
      ),
  );
  check(
    'Reward retirement preserves the response announcement',
    (await page.locator('#announcer').innerText()).includes('Respuesta correcta'),
  );
  await page.screenshot({
    path: new URL('lectura-sin-aviso-xp-viewport.png', directory).pathname,
    animations: 'disabled',
  });
  await page.locator('#next-question').click();
  const scrollQuestion = await currentQuestion();
  await page.locator(`[data-choice="${scrollQuestion.correctIndex}"]`).click();
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() =>
    document.querySelector('#reward-toast').classList.contains('is-reading'),
  );
  check(
    'Scrolling to read hides the XP notice before it can cover text',
    await page
      .locator('#reward-toast')
      .evaluate((element) => getComputedStyle(element).opacity === '0'),
  );
  await start('exam');
  const exam = (await state()).activity;
  await page.locator(`[data-choice="${exam.options[0].index}"]`).click();
  await page.locator(`[data-choice="${exam.options[1].index}"]`).click();
  check(
    'Exam remains editable without revealing correctness',
    (await page.locator('.answer[aria-disabled=true]').count()) === 0 &&
      (await page.locator('.answer.is-selected').getAttribute('data-choice')) ===
        String(exam.options[1].index) &&
      (await page.locator('.answer.is-correct,.answer.is-wrong').count()) === 0,
  );
  await start('matching');
  check(
    'Matching has one task column on a phone',
    await page
      .locator('.matching-board')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length === 1),
  );
  check(
    'Matching layer column is hidden on a phone',
    !(await page.locator('.matching-layer-column').isVisible()),
  );
  check(
    'Every pending task has a labelled native layer selector',
    (await page.locator('[data-match-form] select').count()) === 7 &&
      (await page.locator('[data-match-form] label[for]').count()) === 7,
  );
  const card = (await state()).activity.tasks[0],
    task = matchingTasks.find((task) => task.id === card.id);
  const form = page.locator(`[data-match-form="${task.id}"]`);
  await form.locator('select').selectOption(String(task.layer === 1 ? 2 : 1));
  await form.locator('[type=submit]').click();
  check(
    'Matching selector reports an incorrect connection with text',
    (await page.locator('.matching-piece .feedback').innerText()).includes('✗ Conexión incorrecta'),
  );
  await form.locator('select').selectOption(String(task.layer));
  await form.locator('[type=submit]').click();
  check(
    'Matching selector connects the selected task',
    (await state()).activity.matched.includes(task.id),
  );
  check(
    'Connected task remains reviewable without being playable',
    (await page.locator(`[data-match-task="${task.id}"]`).getAttribute('aria-disabled')) ===
      'true' &&
      (await page.locator(`[data-match-task="${task.id}"]`).evaluate((button) => !button.disabled)),
  );
  check(
    'Matching phone layout has no horizontal overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await capture('conexiones-movil');
  await page.waitForFunction(() => document.querySelector('#reward-toast').hidden);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: new URL('conexiones-movil-viewport.png', directory).pathname,
    animations: 'disabled',
  });
  await start('duel');
  await page.locator('#duel-ready').click();
  check(
    'Duel does not expose answer states before both turns',
    (await page
      .locator('.answer.is-correct,.answer.is-wrong,.feedback,.alternative-reasons')
      .count()) === 0,
  );
  check(
    'Duel turn is announced with player name',
    (await page.locator('#announcer').innerText()).includes('Turno de'),
  );
  const duel = (await state()).activity;
  await page.locator(`[data-choice="${duel.options[0].index}"]`).click();
  check(
    'Duel handoff announcement gives no correctness clue',
    (await page.locator('#announcer').innerText()).includes('Respuesta guardada.') &&
      !(await page.locator('#announcer').innerText()).includes('correcta'),
  );
  await page.locator('#duel-ready').click();
  await page.locator(`[data-choice="${duel.options[1].index}"]`).click();
  check(
    'Duel reveals results only after both turns',
    (await page.locator('.duel-response').count()) === 2,
  );
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.locator('#duel-next').focus();
  check(
    'High contrast focus has an outline',
    await page
      .locator('#duel-next')
      .evaluate((element) => parseInt(getComputedStyle(element).outlineWidth) >= 3),
  );
  check(
    'Reduced motion removes decorative animation',
    await page
      .locator('.game-panel')
      .evaluate((element) => getComputedStyle(element).animationName === 'none'),
  );
  if (errors.length) console.error('Browser diagnostics', errors);
  check('No runtime errors', errors.length === 0);
  await writeFile(
    new URL('report.json', directory),
    JSON.stringify({ passed: checks.length, checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length, errors, screenshots: directory.pathname }));
} finally {
  await browser.close();
}
