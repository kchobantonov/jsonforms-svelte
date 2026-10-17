import { demoEditorLabel } from '../helpers/demo-labels';
import assert from 'node:assert/strict';
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
  await notifications.click();
  assert.equal(await notifications.isChecked(), true);
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
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const data = page.locator('.monaco-editor:visible .view-lines');
  await data.filter({ hasText: 'notifications' }).waitFor();
  const stored = (await data.innerText()).replaceAll('\u00a0', ' ');
  assert.match(stored, /"notifications": true/);
  assert.match(stored, /"legacyFlag": "false"/);
  assert.match(stored, /"importedCount": 0/);
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(
    `PASS boolean-controls ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`,
  );
});
