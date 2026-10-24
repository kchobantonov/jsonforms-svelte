import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import { demoEditorLabel } from '../helpers/demo-labels';
import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { mkdir } from 'node:fs/promises';
import { demoTest } from '../helpers/demo';

demoTest('boolean-controls', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-boolean-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const notifications = page.locator('[id="#/properties/notifications-input"]');
  await notifications.waitFor();
  assert.equal(await notifications.isChecked(), false);
  assert.equal(await notifications.getAttribute('aria-required'), 'true');
  const clearName = text('Clear value', 'Изчистване на стойността');
  const notificationGroup = page.locator('[class~="group/boolean"]').filter({ has: notifications });
  await notifications.focus();
  if (locale === 'en' && webcomponent) {
    const form = page.locator(`jsonforms-svelte-${family}`);
    await mkdir('test-results', { recursive: true });
    await page.setViewportSize({ width: 390, height: 900 });
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as JsonFormsFlowbiteElement).mode = mode;
      }, mode);
      await form.screenshot({
        path: `test-results/boolean-clear-${family}-${mode}-narrow.png`,
        animations: 'disabled',
      });
    }
    await form.evaluate((element) => {
      (element as JsonFormsFlowbiteElement).mode = 'light';
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await notificationGroup.getByRole('button', { name: clearName, exact: true }).click();
  await expect
    .poll(() => notificationGroup.getByRole('button', { name: clearName, exact: true }).count())
    .toBe(0);
  assert.equal(await notifications.isChecked(), false);
  await notifications.click();
  assert.equal(await notifications.isChecked(), true);
  await page.getByRole('tab', { name: text('Switch', 'Превключвател'), exact: true }).click();
  const remote = page.locator('[id="#/properties/remoteWorker-input"]');
  await remote.focus();
  await remote.press('Space');
  assert.equal(await remote.isChecked(), false);
  await page
    .locator('[class~="group/boolean"]')
    .filter({ has: remote })
    .getByRole('button', { name: clearName, exact: true })
    .click();
  await page
    .getByRole('tab', { name: text('Invalid values', 'Невалидни стойности'), exact: true })
    .click();
  const legacy = page.locator('[id="#/properties/legacyFlag-input"]');
  assert.equal(await legacy.isChecked(), false);
  assert.equal(await legacy.getAttribute('aria-invalid'), 'true');
  if (family === 'shadcn') assert.equal(await legacy.getAttribute('aria-checked'), 'mixed');
  else
    assert.equal(
      await legacy.evaluate((element) => (element as HTMLInputElement).indeterminate),
      true,
    );
  const imported = page.locator('[id="#/properties/importedCount-input"]');
  assert.equal(await imported.isChecked(), false);
  const hint = await imported.getAttribute('aria-describedby');
  assert.ok(hint);
  assert.equal(
    await page.locator(`[id="${hint}"]`).textContent(),
    text('Not a true or false value', 'Стойността не е да или не'),
  );
  await page
    .getByRole('tab', { name: text('Table cells', 'Клетки в таблица'), exact: true })
    .click();
  const invalidCell = page.locator('td [aria-invalid="true"]:visible').first();
  await invalidCell.waitFor();
  assert.equal(await invalidCell.isChecked(), false);
  const firstRow = page.locator('tbody tr:visible').first();
  await firstRow
    .locator('[class~="group/boolean"]')
    .last()
    .getByRole('button', { name: clearName, exact: true })
    .click();
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const data = page.locator('.monaco-editor:visible .view-lines');
  await data.filter({ hasText: 'notifications' }).waitFor();
  const stored = (await data.innerText()).replaceAll('\u00a0', ' ');
  assert.match(stored, /"notifications": true/);
  assert.match(stored, /"legacyFlag": "false"/);
  assert.match(stored, /"importedCount": 0/);
  assert.doesNotMatch(stored, /"remoteWorker":/);
  assert.match(stored, /"name": "Jane Doe",\s*"active": true\s*}/);
  assert.match(stored, /"name": "Richard Roe",\s*"active": "false",\s*"onCall": true/);
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(
    `PASS boolean-controls ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`,
  );
});
