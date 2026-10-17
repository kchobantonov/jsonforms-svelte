import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-combinators/supplemental-translations.json';

demoTest('combinators', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const catalog = translations[locale];
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const email = page.locator('input[id*="/properties/email-input"]');
  await email.waitFor();
  assert.equal(await email.inputValue(), 'alex.moreau@example.com');
  await page.getByRole('tab', { name: 'anyOf', exact: true }).click();
  const room = page.locator('input[id*="/properties/room-input"]');
  await room.waitFor();
  assert.equal(await room.inputValue(), 'Willow Room');
  await page.getByRole('tab', { name: catalog.Online, exact: true }).click();
  await page.locator('input[id*="/properties/joinUrl-input"]').waitFor();
  await page.getByRole('tab', { name: catalog['On site'], exact: true }).click();
  assert.equal(await room.inputValue(), 'Willow Room');
  await page.getByRole('tab', { name: 'allOf', exact: true }).click();
  assert.equal(
    await page.locator('input[id*="/properties/assetTag-input"]').inputValue(),
    'AB1234',
  );
  await page
    .getByRole('tab', {
      name: catalog['specCombinators.ui/elements/1/elements/3.label'],
      exact: true,
    })
    .click();
  assert.equal(
    await page
      .getByLabel(catalog['specCombinators.schema/properties/attendees.label'], { exact: true })
      .inputValue(),
    '8',
  );
  assert.deepEqual(errors, []);
});
