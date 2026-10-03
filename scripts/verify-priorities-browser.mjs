const { chromium } = await import(process.env.OSI_PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { activities } from '../src/data/activities.js';
import { learningQuestions } from '../src/data/questions/index.js';
import { cases } from '../src/data/cases.js';
import { units } from '../src/data/units.js';
import { lessonContent } from '../src/features/study/content.js';
import { createChallenge } from '../src/domain/class-challenge.js';

const base = process.env.OSI_TEST_URL || 'http://127.0.0.1:5173/';
const directory = new URL('../work/browser-priorities/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const errors = [],
  checks = [],
  screenshots = [];
let failure = null;

function check(label, condition = true) {
  assert.ok(condition, label);
  checks.push(label);
}

async function isolated(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
  });
  await page.goto(base);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  return { context, page };
}

const state = (page) => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('osi-quest-v1')));

async function waitRoute(page, path) {
  await page.waitForFunction(
    (route) => JSON.parse(window.render_game_to_text()).route === route,
    path,
  );
  await page.locator('h1').first().waitFor();
}

async function route(page, path) {
  const current = await state(page);
  if (
    current.route === 'play/run' &&
    current.activity &&
    !current.activity.done &&
    !current.roundPaused &&
    path !== 'play/run'
  ) {
    await page.locator('[data-round-close]').click();
    await page.locator('[data-round-action=exit]').click();
    await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).route !== 'play/run');
  }
  await page.evaluate((route) => {
    location.hash = `/${route}`;
  }, path);
  await waitRoute(page, path);
}

async function reload(page) {
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  await page.locator('h1').first().waitFor();
}

async function start(page, kind, difficulty = 'normal') {
  await route(page, `setup/${kind}`);
  if (await page.locator('[name=difficulty]').count())
    await page.locator(`[name=difficulty][value=${difficulty}]`).check();
  await page.locator('#setup-form button[type=submit]').click();
  await waitRoute(page, 'play/run');
}

async function answer(page, correct = true) {
  const current = (await state(page)).activity;
  const question = learningQuestions.find((item) => item.id === current.questionId);
  assert.ok(question, `Question ${current.questionId} exists in the source bank`);
  const index = correct
    ? question.correctIndex
    : current.options.find((option) => option.index !== question.correctIndex).index;
  await page.locator(`[data-choice="${index}"]`).click();
  return question;
}

async function shot(page, name, fullPage = true) {
  await page.screenshot({
    path: new URL(`${name}.png`, directory).pathname,
    fullPage,
    animations: 'disabled',
  });
  screenshots.push(name);
}

async function noOverflow(page, label) {
  check(label, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}

async function chooserChecks() {
  const { context, page } = await isolated();
  try {
    await route(page, 'play');
    check(
      'Every activity has a separate direct start and setup link',
      (await page.locator('.activity-card').count()) === activities.length &&
        (await page.locator('.activity-card [data-quickstart]').count()) === activities.length &&
        (await page.locator('.activity-card a[href^="#/setup/"]').count()) === activities.length,
    );
    check('Activity cards do not contain nested links', (await page.locator('a a').count()) === 0);
    check(
      'A new profile does not display an empty pending filter',
      (await page.locator('[data-play-filter=due]').count()) === 0,
    );
    await page.evaluate(() => {
      const value = JSON.parse(
        localStorage.getItem('osi-quest-v1') || '{"version":3,"read":[],"stats":{},"xp":0}',
      );
      delete value.integrity;
      value.playFilter = 'due';
      localStorage.setItem('osi-quest-v1', JSON.stringify(value));
    });
    await reload(page);
    check(
      'A remembered pending filter with no due work falls back to all activities',
      (await page.locator('.activity-card:visible').count()) === activities.length &&
        (await page.locator('[data-play-filter=all]').getAttribute('aria-pressed')) === 'true',
    );
    await page.locator('[data-play-filter=hands-on]').click();
    check(
      'Manipulation filter displays three activities and its matching count',
      (await page.locator('.activity-card:visible').count()) === 3 &&
        (await page.locator('[data-play-filter=hands-on] > span').innerText()) === '3',
    );
    await reload(page);
    check(
      'Activity group preference survives reload',
      (await page.locator('.activity-card:visible').count()) === 3 &&
        (await stored(page)).playFilter === 'hands-on',
    );
    await page.locator('[data-play-filter=all]').click();
    await shot(page, 'elegir-actividad');

    await route(page, 'setup/order');
    await page.locator('[name=direction][value=send]').check();
    await page.locator('[name=difficulty][value=hard]').check();
    check(
      'Changing difficulty preserves explicitly selected send direction',
      await page.locator('[name=direction][value=send]').isChecked(),
    );
    await page.locator('[name=difficulty][value=normal]').check();
    check(
      'Returning to normal still preserves send direction',
      await page.locator('[name=direction][value=send]').isChecked(),
    );
    await page.locator('#setup-form button[type=submit]').click();
    await waitRoute(page, 'play/run');
    check(
      'The real order session uses the chosen direction',
      (await state(page)).activity.direction === 'send',
    );
    check(
      'Valid personal start remembers only the reusable configuration',
      JSON.stringify((await stored(page)).activityPreferences.order) ===
        JSON.stringify({ difficulty: 'normal', direction: 'send' }),
    );
    for (const layer of [7, 6, 5, 4, 3, 2, 1])
      await page.locator(`[data-layer="${layer}"]`).click();
    check('Remembering setup does not change normal rewards', (await state(page)).xp === 56);
    await route(page, 'play');
    const orderCard = page.locator('.activity-card:has([data-quickstart=order])');
    await orderCard.locator('summary').click();
    check(
      'The activity displays best and latest completed results',
      (await orderCard.locator('.activity-history').innerText()).includes('7/7'),
    );
    check(
      'The remembered direction is visible before starting',
      (await orderCard.locator('.activity-configuration').innerText()).includes('Normal · Envío'),
    );
    await orderCard.locator('[data-quickstart=order]').click();
    await waitRoute(page, 'play/run');
    check(
      'A single quickstart opens a fresh round with the remembered direction',
      (await state(page)).activity.direction === 'send' &&
        (await state(page)).activity.built.length === 0,
    );
    await route(page, 'setup/order');
    check(
      'Setup also restores the remembered send direction and normal difficulty',
      (await page.locator('[name=direction][value=send]').isChecked()) &&
        (await page.locator('[name=difficulty][value=normal]').isChecked()),
    );

    await route(page, 'setup/survival');
    await page.locator('[name=difficulty][value=hard]').check();
    await page.locator('[name=timed]').check();
    await page.locator('#setup-form button[type=submit]').click();
    await waitRoute(page, 'play/run');
    check(
      'Survival preserves its clock preference in the live session and storage',
      (await state(page)).activity.timed && (await stored(page)).activityPreferences.survival.timed,
    );
    await route(page, 'setup/survival');
    await reload(page);
    check(
      'Timer and difficulty preference are restored independently from other activities',
      (await page.locator('[name=timed]').isChecked()) &&
        (await page.locator('[name=difficulty][value=hard]').isChecked()),
    );

    await route(page, 'setup/cases');
    await page.locator(`[name=caseId][value="${cases.at(-1).id}"]`).check();
    await page.locator('#setup-form button[type=submit]').click();
    await waitRoute(page, 'play/run');
    check(
      'The selected guided case starts with its own first question',
      (await state(page)).activity.questionId === cases.at(-1).questionIds[0],
    );
    await route(page, 'setup/cases');
    await reload(page);
    check(
      'The last guided case selection survives reload',
      await page.locator(`[name=caseId][value="${cases.at(-1).id}"]`).isChecked(),
    );

    await start(page, 'function');
    const beforeAnswer = (await state(page)).xp;
    const question = await answer(page, false);
    check(
      'An incorrect answer shows symbolic and textual status',
      (await page.locator('.answer.is-wrong .answer-mark').innerText()).includes('✗') &&
        (await page.locator('.answer.is-wrong .answer-mark').innerText()).includes('Tu respuesta'),
    );
    check(
      'The correction identifies the correct answer without color alone',
      (await page.locator('.answer.is-correct .answer-mark').innerText()).includes('Correcta') &&
        (await page.locator('#question-feedback .feedback-answer').innerText()).includes(
          question.choices[question.correctIndex],
        ),
    );
    const guarded = await stored(page);
    await page
      .locator('[data-choice]')
      .first()
      .evaluate((button) => button.click());
    await page
      .locator('[data-choice]')
      .last()
      .evaluate((button) => button.click());
    await page.locator('[data-choice]').first().focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('a');
    await page.keyboard.press('d');
    check(
      'Reviewing revealed alternatives cannot rescore or record an extra answer',
      (await state(page)).xp === beforeAnswer &&
        JSON.stringify((await stored(page)).stats) === JSON.stringify(guarded.stats),
    );
    check(
      'Revealed alternatives stay native keyboard-focusable buttons',
      await page
        .locator('[data-choice]')
        .first()
        .evaluate((button) => button.getAttribute('aria-disabled') === 'true' && !button.disabled),
    );
    await page.locator('[data-choice]').first().focus();
    await page.keyboard.press('Tab');
    check(
      'Tab reaches another revealed alternative',
      await page.evaluate(() => document.activeElement?.matches('[data-choice]')),
    );
    await route(page, 'play');
    await page.locator('[data-play-filter=due]').click();
    check(
      'A real failed question makes adaptive review visible and pending',
      (await page.locator('.activity-card:has([data-quickstart=adaptive])').isVisible()) &&
        Number(
          await page
            .locator('.activity-card:has([data-quickstart=adaptive])')
            .getAttribute('data-pending'),
        ) >= 1,
    );
    check(
      'The pending item belongs to an attempted question',
      (await stored(page)).stats[question.id].seen === 1,
    );
    await reload(page);
    check(
      'Pending counts and filter are rebuilt from saved evidence',
      await page.locator('.activity-card:has([data-quickstart=adaptive])').isVisible(),
    );

    const personalPreferences = (await stored(page)).activityPreferences;
    const personalDifficulty = (await stored(page)).difficulty;
    const shared = createChallenge({ mode: 'FUN', difficulty: 'hard', seed: 'PRIORIDADES' });
    await route(page, `class/${shared.code}`);
    await page.locator('#class-start').click();
    await waitRoute(page, 'play/run');
    check(
      'A shared challenge cannot overwrite personal activity choices',
      JSON.stringify((await stored(page)).activityPreferences) ===
        JSON.stringify(personalPreferences) &&
        (await stored(page)).difficulty === personalDifficulty,
    );
    await route(page, 'story');
    check(
      'The complete seven-chapter story remains available',
      (await page.locator('.story-chapter').count()) === 7,
    );
    check(
      'Story gates remain intact for a new story profile',
      (await page.locator('.story-chapter:not(.is-locked)').count()) === 1,
    );
  } catch (error) {
    await shot(page, 'fallo-eleccion').catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

async function mobileChecks(width) {
  const { context, page } = await isolated({ width, height: 844 });
  try {
    await route(page, 'play');
    await noOverflow(page, `Activity chooser fits ${width}px`);
    await page.locator('[data-play-filter=hands-on]').click();
    const button = page.locator('.activity-card:has([data-quickstart=order]) [data-quickstart]');
    check(
      `Mobile quickstart is a full touch-sized button at ${width}px`,
      await button.evaluate((element) => element.getBoundingClientRect().height >= 44),
    );
    await shot(page, `actividades-movil-${width}`);
    await button.click();
    await waitRoute(page, 'play/run');
    check(
      `Mobile quickstart starts without a setup detour at ${width}px`,
      (await state(page)).activity.type === 'order',
    );
    await start(page, 'scenario');
    await page.evaluate(() => scrollTo(0, 400));
    await answer(page, false);
    const next = page.locator('#next-question');
    check(
      `Next stays reachable above mobile navigation at ${width}px`,
      await next.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const nav = document.querySelector('.app-sidebar').getBoundingClientRect();
        return box.top >= 0 && box.bottom <= nav.top + 1 && box.height >= 44;
      }),
    );
    await page.locator('#show-explanation').click();
    check(
      `Explanation shortcut moves keyboard focus to feedback at ${width}px`,
      await page
        .locator('#question-feedback')
        .evaluate((element) => element === document.activeElement),
    );
    await noOverflow(page, `Correction and minimap fit ${width}px`);
    await shot(page, `explicacion-movil-${width}`, false);
    const previousIndex = (await state(page)).activity.index;
    await next.click();
    check(
      `Sticky next advances exactly once at ${width}px`,
      (await state(page)).activity.index === previousIndex + 1,
    );
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
    await answer(page);
    check(
      `Text answer statuses remain usable with forced colors at ${width}px`,
      (await page.locator('.answer.is-correct .answer-mark').innerText()).includes('Correcta'),
    );
    await next.click();
    check(
      `Reduced motion disables round transitions at ${width}px`,
      await page.evaluate(
        () => document.querySelector('#main').getAnimations({ subtree: true }).length === 0,
      ),
    );
  } catch (error) {
    await shot(page, `fallo-movil-${width}`).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

async function lessonChecks() {
  const { context, page } = await isolated();
  try {
    await route(page, 'study');
    check(
      'The route contains eighteen lessons with current totals',
      units.length === 18 &&
        (await page.locator('.unit-row').count()) === units.length &&
        (await page.locator('.study-overview .section-heading .badge').innerText()).includes(
          `0 / ${units.length}`,
        ),
    );
    for (const id of ['url', 'wifi', 'home-network', 'speed', 'security', 'browser-errors']) {
      const unit = units.find((item) => item.id === id),
        content = lessonContent(unit);
      await route(page, `study/${id}`);
      check(
        `Practical lesson ${id} presents its full explanation and section index`,
        (await page.locator('.lesson-section').count()) === content.sections.length &&
          (await page.locator('[data-lesson-section]').count()) === content.sections.length &&
          (await page.locator('.lesson-intro').innerText()) === content.introduction,
      );
      check(
        `Lesson ${id} offers self-explanation without pretending to score mastery`,
        (await page.locator('#lesson-notes').isVisible()) &&
          (await page.locator('.teach-back').innerText()).includes('No se califican ni suman XP'),
      );
      const before = await stored(page),
        beforeXP = (await state(page)).xp;
      await page.locator(`[data-check="${content.check.correctIndex}"]`).click();
      check(
        `Lesson ${id} corrects its check with text and symbols`,
        (await page.locator('#lesson-feedback').innerText()).includes('✓') &&
          (await page.locator('.lesson-check .is-correct').innerText()).includes('Correcta'),
      );
      await page
        .locator('[data-check]')
        .first()
        .evaluate((button) => button.click());
      check(
        `Study check ${id} cannot earn XP or contaminate assessment statistics`,
        (await state(page)).xp === beforeXP &&
          JSON.stringify((await stored(page)).stats) === JSON.stringify(before?.stats ?? {}),
      );
    }
    await route(page, 'study/url');
    await page.locator('[data-lesson-section="2"]').click();
    await waitRoute(page, 'study/url/2');
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem('osi-quest-v1')).lessonBookmark?.unitId === 'url' &&
        JSON.parse(localStorage.getItem('osi-quest-v1')).lessonBookmark?.sectionIndex === 2,
    );
    check(
      'Section navigation exposes the reading location accessibly',
      (await page.locator('[data-lesson-section="2"]').getAttribute('aria-current')) ===
        'location' && (await page.locator('#reading-progress-label').innerText()).includes('3 de'),
    );
    await page
      .locator('#lesson-notes')
      .fill('DNS busca información del destino. Una respuesta no demuestra que HTTP funcione.');
    await route(page, 'home');
    check(
      'Home resumes the exact bookmarked lesson section',
      (await page.locator('[data-resume-lesson]').first().getAttribute('href')) === '#/study/url/2',
    );
    await reload(page);
    check(
      'The exact reading bookmark survives reload',
      (await page.locator('[data-resume-lesson]').first().getAttribute('href')) ===
        '#/study/url/2' && (await stored(page)).lessonBookmark.sectionIndex === 2,
    );
    await page.locator('[data-resume-lesson]').first().click();
    await waitRoute(page, 'study/url/2');
    await page.waitForFunction(() => document.activeElement?.id === 'lesson-section-2');
    check(
      'Resuming a section moves focus to the intended heading area',
      await page
        .locator('#lesson-section-2')
        .evaluate((element) => element === document.activeElement),
    );
    check(
      'Personal explanation remains explicitly temporary after reload',
      (await page.locator('#lesson-notes').inputValue()) === '',
    );
    await shot(page, 'leccion-con-indice');
    await page.locator('#complete-lesson').click();
    check(
      'Marking a lesson read is a separate explicit action',
      (await stored(page)).read.includes('url'),
    );
    await page.locator('#unread-lesson').click();
    check(
      'A completed lesson can be marked for rereading',
      !(await stored(page)).read.includes('url'),
    );
    await page.locator('#complete-lesson').click();
    await route(page, 'study');
    check(
      'Study index reflects the new total and the explicitly read lesson',
      (await page.locator('.study-overview .section-heading .badge').innerText()).includes(
        `1 / ${units.length}`,
      ) &&
        (await page.locator('a.unit-row[href="#/study/url"] .unit-number.completed').isVisible()),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await route(page, 'study/wifi');
    await noOverflow(page, 'Full study and mobile section index fit390px');
    await page.locator('.lesson-mobile-toc > summary').click();
    await page.locator('.lesson-mobile-toc a[href="#/study/wifi/1"]').click();
    await waitRoute(page, 'study/wifi/1');
    await page.waitForFunction(() => {
      const bookmark = JSON.parse(localStorage.getItem('osi-quest-v1')).lessonBookmark;
      return (
        bookmark?.unitId === 'wifi' &&
        bookmark.sectionIndex === 1 &&
        document.activeElement?.id === 'lesson-section-1'
      );
    });
    check(
      'Mobile section index reaches the requested section',
      (await stored(page)).lessonBookmark.unitId === 'wifi' &&
        (await stored(page)).lessonBookmark.sectionIndex === 1,
    );
    await shot(page, 'estudio-movil-390', false);
  } catch (error) {
    await shot(page, 'fallo-estudio').catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

try {
  await chooserChecks();
  await lessonChecks();
  await mobileChecks(390);
  await mobileChecks(320);
  check('No runtime, console or HTTP errors', errors.length === 0);
} catch (error) {
  failure = { message: error.message, stack: error.stack };
  throw error;
} finally {
  await writeFile(
    new URL('report.json', directory),
    JSON.stringify(
      { base, checks: checks.length, labels: checks, screenshots, errors, failure },
      null,
      2,
    ),
  );
  await browser.close();
  if (!failure)
    console.log(JSON.stringify({ passed: checks.length, errors, screenshots: directory.pathname }));
}
