import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { units } from '../src/data/units.js';
import { lessonContent } from '../src/features/study/content.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../work/browser-study-checks/', import.meta.url);
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['scripts/dev.mjs', '--root', 'dist', '--port', '0'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let browser;
const errors = [];
let attempts = 0;
try {
  const [line] = await once(server.stdout, 'data');
  const origin = String(line).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`);
  });
  for (const unit of units) {
    const id = unit.id;
    const content = lessonContent(unit);
    const check = content.check;
    for (let selected = 0; selected < check.choices.length; selected++) {
      // A reload starts a fresh check and shuffles the displayed alternatives.
      await page.goto(`${origin}/#/study/${id}`);
      await page.reload();
      await page.locator('.lesson-check h3').waitFor();
      if (unit.layer) {
        assert.equal(await page.locator('.lesson-section').count(), 6);
        assert.equal(await page.locator('[data-lesson-section]').count(), 6);
        assert.ok((await page.locator('.teach-back').innerText()).includes(content.teachBack));
      }
      assert.equal(await page.locator('.lesson-check h3').innerText(), check.prompt);
      assert.equal(await page.locator('[data-check]').count(), 4);
      const choice = page.locator(`[data-check="${selected}"]`);
      assert.equal(await choice.innerText(), check.choices[selected]);
      const style = await choice.evaluate((button) => {
        const s = getComputedStyle(button);
        return { display: s.display, radius: s.borderRadius };
      });
      assert.equal(style.display, 'flex', 'Direct study entry loads shared answer styles');
      assert.notEqual(style.radius, '0px');
      await choice.click();
      const feedback = page.locator('#lesson-feedback');
      await feedback.locator('.feedback').waitFor();
      const text = await feedback.innerText();
      assert.ok(text.includes(check.explanation), `${id}:${selected}: overall explanation`);
      const correct = selected === check.correctIndex;
      assert.equal(
        await feedback.locator(correct ? '.feedback-correct' : '.feedback-wrong').count(),
        1,
      );
      if (!correct) {
        assert.ok(text.includes(check.reasons[selected]), `${id}:${selected}: selected reason`);
        await page.locator(`[data-check="${check.correctIndex}"]`).click({ force: true });
        assert.equal(await feedback.innerText(), text, 'A second click must not replace feedback');
      }
      assert.equal(await page.locator('[data-check][aria-disabled="true"]').count(), 4);
      assert.ok(await choice.isVisible());
      const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('osi-quest-v1')));
      assert.equal(progress?.xp ?? 0, 0, 'Study checks are not rewarded practice');
      assert.ok(!(progress?.read ?? []).includes(id), 'Answering does not mark a lesson as read');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (id === 'addresses' && selected === 0)
        await page
          .locator('.lesson-check')
          .screenshot({ path: fileURLToPath(new URL('mac-vs-port.png', output)) });
      if (id === 'encapsulation' && correct)
        await page
          .locator('.lesson-check')
          .screenshot({ path: fileURLToPath(new URL('encapsulation.png', output)) });
      if (id === 'layer-4' && selected === 0)
        await page
          .locator('.lesson-check')
          .screenshot({ path: fileURLToPath(new URL('transport-check.png', output)) });
      if (id === 'layer-6' && correct)
        await page
          .locator('.lesson-check')
          .screenshot({ path: fileURLToPath(new URL('presentation-check.png', output)) });
      attempts++;
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${origin}/#/study/addresses`);
  await page.reload();
  await page.locator('.lesson-check').waitFor();
  await page.locator('[data-check="3"]').click();
  await page
    .locator('.lesson-check')
    .screenshot({ path: fileURLToPath(new URL('desktop.png', output)) });
  await page.goto(`${origin}/#/study/layer-2`);
  await page.getByRole('heading', { name: '2. Enlace de datos', exact: true }).waitFor();
  assert.ok((await page.locator('.lesson').innerText()).includes('tramo a tramo'));
  await page.goto(`${origin}/#/study/layer-4`);
  await page.getByRole('heading', { name: '4. Transporte', exact: true }).waitFor();
  assert.ok((await page.locator('.lesson').innerText()).includes('departamento destinatario'));
  await page.locator('[data-lesson-section="4"]').click();
  await page.waitForFunction(() => document.activeElement?.id === 'lesson-section-4');
  assert.ok((await page.locator('#lesson-section-4').innerText()).includes('confirmación TCP'));
  await page.screenshot({ path: fileURLToPath(new URL('transport-lesson-desktop.png', output)) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/#/study/layer-6/1`);
  await page.waitForFunction(() => document.activeElement?.id === 'lesson-section-1');
  assert.ok((await page.locator('#lesson-section-1').innerText()).includes('Muñoz'));
  await page.screenshot({ path: fileURLToPath(new URL('presentation-lesson-mobile.png', output)) });
  assert.deepEqual(errors, []);
  const report = { production: true, lessons: units.length, attempts, errors };
  await writeFile(new URL('report.json', output), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  server.kill();
}
