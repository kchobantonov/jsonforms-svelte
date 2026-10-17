import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-validator-profile/translations.json';

demoTest('validator-profile', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const catalog = translations[locale];
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-validator-profile?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page.getByRole('tab', { name: catalog['transformTab.label'], exact: true }).click();
  const code = page.locator('input[id*="/properties/code-input"]');
  await code.waitFor();
  assert.equal(await code.inputValue(), 'AB-12');
  await page.getByRole('tab', { name: catalog['defaultsTab.label'], exact: true }).click();
  const greeting = page.locator('input[id*="/properties/greeting-input"]');
  await greeting.waitFor();
  assert.equal(await greeting.inputValue(), 'Welcome, student.');
  assert.equal(await page.locator('input[id*="/properties/currency-input"]').inputValue(), 'EUR');
  await page.getByRole('tab', { name: catalog['messagesTab.label'], exact: true }).click();
  await page
    .getByText(catalog['error.errorMessage.nicknameRequired'], { exact: true })
    .first()
    .waitFor();
  assert.deepEqual(errors, []);
});
