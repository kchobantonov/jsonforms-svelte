import assert from 'node:assert/strict';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-cron-control/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('cron-control', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const raw = page.locator('input[id*="/properties/stockSync"]:visible');
  await raw.waitFor();
  assert.equal(await raw.inputValue(), '0 0/15 * * * *');
  await page
    .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
    .first()
    .click();
  const expression = page.getByRole('textbox', {
    name: messages[locale]['cron.expression'],
    exact: true,
  });
  await expression.fill('0 0 10 * * *');
  await page.getByRole('button', { name: messages[locale]['cron.cancel'], exact: true }).click();
  assert.equal(await raw.inputValue(), '0 0/15 * * * *');
  await page
    .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
    .first()
    .click();
  await expression.fill('0 0 11 * * *');
  await page.getByRole('button', { name: messages[locale]['cron.ok'], exact: true }).click();
  await expect.poll(() => raw.inputValue()).toBe('0 0 11 * * *');
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section3.label'],
      exact: true,
    })
    .click();
  assert.equal(
    await page.locator('input[id*="/properties/unixFiveField"]:visible').inputValue(),
    '*/15 * * * *',
  );
  assert.equal(
    await page.locator('input[id*="/properties/quartzSevenField"]:visible').inputValue(),
    '0 0 12 ? * MON 2027',
  );
  assert.deepEqual(errors, []);
});
