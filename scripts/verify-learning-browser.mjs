const { chromium } = await import(process.env.OSI_PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { learningQuestions } from '../src/data/questions/index.js';
import { matchingTasks } from '../src/data/matching.js';
import { packetMissions } from '../src/data/packet-missions.js';

const base = process.env.OSI_TEST_URL || 'http://127.0.0.1:5173/';
const directory = new URL('../work/browser-learning/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [],
  checks = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('response', (response) => {
  if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
});
const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('osi-quest-v1')));
const question = (current) => learningQuestions.find((item) => item.id === current.questionId);
function check(label, condition = true) {
  assert.ok(condition, label);
  checks.push(label);
}
async function waitView(path) {
  await page.waitForFunction(
    (path) =>
      typeof window.render_game_to_text === 'function' &&
      JSON.parse(window.render_game_to_text()).route === path &&
      !document.querySelector('#main').hasAttribute('aria-busy'),
    path,
  );
  await page.locator('h1').first().waitFor();
}
async function waitRound(kind) {
  await page.waitForFunction((kind) => {
    const current = JSON.parse(window.render_game_to_text());
    return (
      current.route === 'play/run' &&
      current.activity?.kind === kind &&
      !current.activity.done &&
      !document.querySelector('#main').hasAttribute('aria-busy')
    );
  }, kind);
}
async function retry(selector, kind) {
  await page.locator(selector).click();
  await waitRound(kind);
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
  await page.evaluate((value) => {
    location.hash = `/${value}`;
  }, path);
  await waitView(path);
}
async function start(kind, difficulty = 'normal', { timed = false, names, direction } = {}) {
  await route(`setup/${kind}`);
  if (await page.locator('[name=difficulty]').count())
    await page.locator(`[name=difficulty][value=${difficulty}]`).check();
  if (timed) await page.locator('[name=timed]').check();
  if (direction) await page.locator(`[name=direction][value=${direction}]`).check();
  if (names) {
    await page.locator('[name=player1]').fill(names[0]);
    await page.locator('[name=player2]').fill(names[1]);
  }
  await page.locator('#setup-form button[type=submit]').click();
  await waitRound(kind);
}
async function answer(correct = true) {
  const current = (await state()).activity,
    q = question(current);
  const index = correct
    ? q.correctIndex
    : current.options.find((option) => option.index !== q.correctIndex).index;
  await page.locator(`[data-choice="${index}"]`).click();
}
async function finishQuiz() {
  const ids = [];
  while (!(await state()).activity.done) {
    ids.push((await state()).activity.questionId);
    await answer();
    await page.locator('#next-question').click();
  }
  return ids;
}
async function shot(name) {
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: new URL(`${name}.png`, directory).pathname, fullPage: true });
}
async function noOverflow(label) {
  check(label, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}
try {
  await page.goto(base);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  await page.evaluate(() =>
    localStorage.setItem(
      'osi-quest-v1',
      JSON.stringify({
        version: 3,
        xp: 20,
        read: [],
        stats: {},
        cards: {},
        history: [
          {
            mode: 'function',
            difficulty: 'normal',
            total: 7,
            correct: 4,
            xp: 32,
            when: Date.now() - 2000,
          },
          {
            mode: 'function',
            difficulty: 'normal',
            total: 7,
            correct: 6,
            xp: 48,
            when: Date.now() - 1000,
          },
        ],
      }),
    ),
  );
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  await route('play');
  check('Fifteen selectable activities', (await page.locator('.activity-card').count()) === 15);
  await start('function');
  const failed = [];
  for (let i = 0; i < 7; i++) {
    if (i < 2) failed.push((await state()).activity.questionId);
    if (i === 1) await page.locator('#hint-button').click();
    await answer(i !== 0);
    await page.locator('#next-question').click();
  }
  check('Normal rewards exclude wrong answers and halve helped answers', (await state()).xp === 64);
  const report = (await stored()).history.at(-1);
  check(
    'Round stores elapsed time and layer failures',
    report.durationMs > 0 &&
      report.failures.reduce((sum, item) => sum + item.wrong + item.assisted, 0) === 2,
  );
  check(
    'Result compares against two prior rounds',
    (await page.locator('.result-insights').innerText()).includes('2 rondas'),
  );
  check(
    'Result distinguishes error from help',
    (await page.locator('.failure-layers').innerText()).includes('fallo') &&
      (await page.locator('.failure-layers').innerText()).includes('con ayuda'),
  );
  await shot('resultado');
  const historyCount = (await stored()).history.length;
  await route('progress');
  await route('play/run');
  check(
    'Revisiting result does not record the round twice',
    (await stored()).history.length === historyCount,
  );
  await retry('#retry-mistakes', 'retry');
  check('Retry contains only two pending questions', (await state()).activity.total === 2);
  const repeated = await finishQuiz();
  check(
    'Retry preserves exact original failed IDs',
    repeated.length === 2 && repeated.every((id) => failed.includes(id)),
  );
  check('Guided normal retry awards half XP without evidence', (await state()).xp === 72);

  await route('progress');
  check(
    'Radar provides SVG and seven textual measurements',
    (await page.locator('.mastery-radar').count()) === 1 &&
      (await page.locator('.mastery-evidence li').count()) === 7,
  );
  await page.locator('[data-radar-level=hard]').click();
  check(
    'Difficulty filter avoids attributing legacy or normal evidence to hard',
    (await page.locator('.mastery-evidence').innerText()).match(/Sin datos/g)?.length === 7,
  );
  await page.locator('[data-concept-practice=tcp-security]').click();
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).route === 'play/run');
  check('Concept badge practice has four distinct probes', (await state()).activity.total === 4);
  const conceptProbeIds = [(await state()).activity.questionId];
  await answer();
  await page.locator('#next-question').click();
  check('One probe cannot unlock badge', !(await stored()).concepts['tcp-security'].earnedAt);
  conceptProbeIds.push((await state()).activity.questionId);
  await answer();
  check(
    'Second distinct proof unlocks feedback badge',
    await page
      .locator('.feedback')
      .innerText()
      .then((text) => text.toLowerCase().includes('insignia')),
  );
  await page.locator('#next-question').click();
  const remainingProbes = await finishQuiz();
  check(
    'Concept practice completes its two remaining distinct probes',
    remainingProbes.length === 2 && new Set([...conceptProbeIds, ...remainingProbes]).size === 4,
  );
  await route('progress');
  check(
    'Badge earned after two unaided proofs',
    (await page.locator('.concept-badge.is-earned').count()) === 1,
  );
  await page.reload();
  await waitView('progress');
  check(
    'Badge persists on reload',
    (await stored()).concepts['tcp-security'].earnedProofIds.length === 2 &&
      (await page.locator('.concept-badge.is-earned').count()) === 1,
  );
  await shot('perfil');

  await start('survival');
  check(
    'Survival begins with three lives and optional clock off',
    (await state()).activity.lives === 3 && !(await state()).activity.timed,
  );
  const survivalBefore = (await state()).xp;
  await answer();
  await page.locator('#next-question').click();
  for (let i = 0; i < 3; i++) {
    await answer(false);
    check(
      `Wrong survival answer loses exactly one life ${i}`,
      (await state()).activity.lives === 2 - i,
    );
    await page.evaluate(() => window.advanceTime(60000));
    check('Feedback cannot lose a second life', (await state()).activity.lives === 2 - i);
    await page.locator('#next-question').click();
  }
  check(
    'Third lost life finishes early',
    (await state()).activity.done && (await stored()).history.at(-1).total === 4,
  );
  check(
    'Early survival rewards only its correct answer',
    (await state()).xp === survivalBefore + 8,
  );
  check(
    'Result explains survival stopped after 4 of 20',
    (await page.locator('.survival-finish').innerText()).includes('4 de 20'),
  );
  await retry('#retry-mistakes', 'retry');
  check('Survival retry targets three mistakes', (await state()).activity.total === 3);
  await finishQuiz();

  await page.setViewportSize({ width: 390, height: 844 });
  await start('survival', 'hard', { timed: true });
  check(
    'New timed round clears previous reward overlay',
    await page.locator('#reward-toast').evaluate((element) => element.hidden),
  );
  check('Optional clock begins near 30 seconds', (await state()).activity.remainingMs > 29000);
  await page.locator('#pause-survival').click();
  const paused = (await state()).activity.remainingMs;
  await page.evaluate(() => window.advanceTime(90000));
  check(
    'Pause freezes clock and hides choices',
    (await state()).activity.remainingMs === paused &&
      (await page.locator('[data-choice]').count()) === 0,
  );
  await page.locator('#pause-survival').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = (await state()).activity.remainingMs;
  await page.evaluate(() => window.advanceTime(90000));
  check(
    'Hidden tab does not consume question time',
    (await state()).activity.remainingMs === hidden,
  );
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await shot('movil-reloj');
  await noOverflow('Mobile clock has no overflow');
  const timedXP = (await state()).xp;
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.advanceTime(30001));
    check(
      'Expired question loses one life and blocks answer',
      (await state()).activity.lives === 2 - i && (await state()).activity.answered,
    );
    await page.evaluate(() => window.advanceTime(60000));
    check(
      'Reading timeout explanation freezes countdown',
      (await state()).activity.lives === 2 - i,
    );
    await page.locator('#next-question').click();
  }
  check(
    'Three timeouts end survival with zero XP',
    (await state()).activity.done && (await state()).xp === timedXP,
  );
  check(
    'Timeouts are a separate failure category',
    (await page.locator('.failure-layers').innerText()).includes('fuera de tiempo'),
  );
  await start('survival', 'hard', { timed: true });
  const completeXP = (await state()).xp;
  check('Full survival visits twenty unique questions', new Set(await finishQuiz()).size === 20);
  check(
    'Hard rewards 20 XP each; survival can win with all lives',
    (await state()).xp === completeXP + 400 &&
      (await state()).activity.lives === 3 &&
      (await stored()).history.at(-1).total === 20,
  );

  await start('duel', 'normal', { names: ['Ana', 'Bea'] });
  const beforeDuel = await stored(),
    misses = [];
  for (let i = 0; i < 7; i++) {
    let first;
    for (let turn = 0; turn < 2; turn++) {
      const handoff = (await state()).activity;
      check(
        'Handoff hides question and answer choices',
        handoff.phase === 'handoff' &&
          !handoff.questionId &&
          (await page.locator('[data-choice]').count()) === 0,
      );
      check('Starting player alternates fairly', handoff.playerIndex === (i + turn) % 2);
      if (i === 0 && turn === 0) await shot('movil-pasar');
      await page.locator('#duel-ready').click();
      const current = (await state()).activity;
      if (!turn) first = current;
      else
        check(
          'Both players get same question and option order',
          current.questionId === first.questionId &&
            JSON.stringify(current.options) === JSON.stringify(first.options),
        );
      if (i === 0 && turn === 0) {
        await shot('movil-duelo');
        await noOverflow('Mobile duel choices have no overflow');
      }
      const right = !(current.playerIndex === 1 && i % 2 === 0);
      if (!right) misses.push(current.questionId);
      await answer(right);
      check(
        'First answer remains hidden until second turn',
        turn
          ? (await state()).activity.phase === 'reveal'
          : (await state()).activity.phase === 'handoff' &&
              (await page.locator('.feedback').count()) === 0,
      );
    }
    check(
      'Reveal displays both players and explanation',
      (await page.locator('.duel-response').count()) === 2 &&
        (await page.locator('.feedback').count()) === 1,
    );
    if (i === 0) await shot('movil-duelo-comparar');
    await page.locator('#duel-next').click();
  }
  const afterDuel = await stored();
  check(
    'Duel records separate 7/7 and 3/7 scores',
    afterDuel.history.at(-1).players[0].correct === 7 &&
      afterDuel.history.at(-1).players[1].correct === 3,
  );
  check(
    'Duel does not change profile XP, accuracy or difficulty',
    afterDuel.xp === beforeDuel.xp &&
      JSON.stringify(afterDuel.stats) === JSON.stringify(beforeDuel.stats) &&
      afterDuel.difficulty === beforeDuel.difficulty,
  );
  check(
    'Duel shows separate failures by layer',
    (await page.locator('.duel-score .failure-layers li').count()) > 0,
  );
  check(
    'Duel scoreboard has no stale XP overlay',
    await page.locator('#reward-toast').evaluate((element) => element.hidden),
  );
  await shot('movil-marcador');
  await noOverflow('Mobile duel scoreboard has no overflow');
  await route('progress');
  check(
    'History anonymizes duel names while preserving scores',
    (await page.locator('.history-list').innerText()).includes('Jugador A: 7/7 · Jugador B: 3/7'),
  );
  await route('play/run');
  await retry('[data-duel-retry="1"]', 'retry');
  check(
    'Individual duel retry has only that player’s four mistakes',
    (await state()).activity.total === 4,
  );
  const privateRetry = await finishQuiz();
  check(
    'Duel retry preserves failed IDs',
    privateRetry.every((id) => misses.includes(id)),
  );
  const afterRetry = await stored();
  check(
    'Private duel retry does not contaminate profile',
    afterRetry.xp === afterDuel.xp &&
      JSON.stringify(afterRetry.stats) === JSON.stringify(afterDuel.stats) &&
      afterRetry.history.length === afterDuel.history.length,
  );

  await page.setViewportSize({ width: 1440, height: 1000 });
  await start('matching');
  const taskIds = (await state()).activity.tasks.map((item) => item.id),
    taskFailures = taskIds.slice(0, 2);
  for (let i = 0; i < taskIds.length; i++) {
    const task = matchingTasks.find((item) => item.id === taskIds[i]);
    await page.locator(`[data-match-task="${task.id}"]`).click();
    if (i === 0) await page.locator(`[data-match-layer="${task.layer === 1 ? 2 : 1}"]`).click();
    if (i === 1) await page.locator('#matching-hint').click();
    await page.locator(`[data-match-layer="${task.layer}"]`).click();
  }
  check(
    'Matching result identifies two assisted connections',
    (await stored()).history.at(-1).correct === 5,
  );
  await retry('#retry-mistakes', 'matching');
  check(
    'Matching retry has only the exact pending task IDs',
    (await state()).activity.tasks.length === 2 &&
      (await state()).activity.tasks.every((item) => taskFailures.includes(item.id)),
  );
  for (const task of (await state()).activity.tasks) {
    await page.locator(`[data-match-task="${task.id}"]`).click();
    await page
      .locator(`[data-match-layer="${matchingTasks.find((item) => item.id === task.id).layer}"]`)
      .click();
  }
  check(
    'Partial matching finishes correctly',
    (await state()).activity.done && (await stored()).history.at(-1).total === 2,
  );

  await start('packet');
  const stages = [];
  for (let i = 0; i < 6; i++) {
    const current = (await state()).activity,
      mission = packetMissions.find((item) => item.id === current.missionId);
    if (i < 2) stages.push(mission.id);
    if (i === 0) {
      const wrong = current.choices.find((item) => item.id !== mission.correctId).id;
      await page.locator(`[data-packet-token="${wrong}"]`).click();
      await page.locator('#packet-add').click();
    }
    if (i === 1) await page.locator('#packet-hint').click();
    await page.locator(`[data-packet-token="${mission.correctId}"]`).click();
    await page.locator('#packet-add').click();
    await page.locator('#packet-next').click();
  }
  await retry('#retry-mistakes', 'packet');
  check('Packet retry contains two tested stages', (await state()).activity.total === 2);
  for (let i = 0; i < 2; i++) {
    const current = (await state()).activity,
      mission = packetMissions.find((item) => item.id === current.missionId);
    check('Packet retry preserves exact stage IDs', stages.includes(mission.id));
    await page.locator(`[data-packet-token="${mission.correctId}"]`).click();
    await page.locator('#packet-add').click();
    await page.locator('#packet-next').click();
  }
  check(
    'Packet retry completes without inflating score for context stages',
    (await state()).activity.done &&
      (await stored()).history.at(-1).total === 2 &&
      (await stored()).history.at(-1).xp === 8,
  );

  await start('order', 'hard', { direction: 'send' });
  await page.locator('[data-layer="1"]').click();
  for (const layer of [7, 6, 5, 4, 3, 2, 1]) await page.locator(`[data-layer="${layer}"]`).click();
  await retry('#retry-mistakes', 'order');
  check(
    'Order retry keeps seven distractor choices despite filled context',
    (await page.locator('[data-layer]:not(:disabled)').count()) === 7,
  );
  await page.locator('[data-layer="7"]').click();
  check(
    'Order retry awards only its one tested layer',
    (await state()).activity.done &&
      (await stored()).history.at(-1).total === 1 &&
      (await stored()).history.at(-1).xp === 10,
  );

  await start('flashcards');
  const unknown = [];
  let cards = 0;
  while (!(await state()).activity.done) {
    if (cards < 2) unknown.push((await state()).activity.cardId);
    await page.locator('#reveal-card').click();
    await page.locator(`[data-rate=${cards < 2 ? 'again' : 'known'}]`).click();
    cards++;
  }
  check(
    'Cards offer an honest self-rated report with time',
    (await page
      .locator('.result-insights')
      .innerText()
      .then((text) => text.includes('recuerdo declarado'))) && cards === 21,
  );
  await retry('#retry-mistakes', 'flashcards');
  check('Cards retry has only two unknown cards', (await state()).activity.total === 2);
  while (!(await state()).activity.done) {
    check('Cards retry preserves exact IDs', unknown.includes((await state()).activity.cardId));
    await page.locator('#reveal-card').click();
    await page.locator('[data-rate=known]').click();
  }
  check(
    'No unknown cards remain after successful recall',
    (await page.locator('#retry-mistakes').count()) === 0,
  );

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await route('progress');
    for (const level of ['all', 'normal', 'hard']) {
      await page.locator(`[data-radar-level=${level}]`).click();
      check(
        'Radar filter preserves keyboard focus',
        await page
          .locator(`[data-radar-level=${level}]`)
          .evaluate((element) => document.activeElement === element),
      );
      await noOverflow(`Profile radar and badges fit ${width}px/${level}`);
    }
    await shot(`movil-perfil-${width}`);
  }
  check('No runtime, console or HTTP errors', errors.length === 0);
  await writeFile(
    new URL('report.json', directory),
    JSON.stringify({ base, checks: checks.length, errors, labels: checks }, null, 2),
  );
  console.log(JSON.stringify({ passed: checks.length, errors, screenshots: directory.pathname }));
} finally {
  await browser.close();
}
