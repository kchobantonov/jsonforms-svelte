import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/translations.json';

demoTest('validator-profile', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const catalog = translations[locale];
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}?ref=AB-1234&campaign=spring#/examples/spec-validator-profile?use-webcomponent=${webcomponent}&drawer=false&source=email`,
  );
  await page.getByRole('tab', { name: catalog['transformTab.label'], exact: true }).click();
  const code = page.locator('input[id*="/properties/code-input"]');
  await code.waitFor();
  assert.equal(await code.inputValue(), 'AB-12');
  assert.equal(
    await page.locator('input[id*="/properties/town-input"]').inputValue(),
    'North Harbour',
  );
  assert.equal(
    await page.locator('input[id*="/properties/note-input"]').inputValue(),
    'Please seat us together',
  );
  await page.getByRole('tab', { name: catalog['defaultsTab.label'], exact: true }).click();
  const greeting = page.locator('input[id*="/properties/greeting-input"]');
  await greeting.waitFor();
  assert.equal(await greeting.inputValue(), 'Welcome, student.');
  assert.equal(await page.locator('input[id*="/properties/currency-input"]').inputValue(), 'EUR');
  assert.equal(await page.getByRole('checkbox', { name: /Confirmed/ }).isChecked(), false);
  assert.equal(await page.locator('input[id*="/properties/ref-input"]').inputValue(), 'AB-1234');
  assert.equal(
    await page.locator('input[id*="/properties/campaign-input"]').inputValue(),
    'spring',
  );
  assert.equal(await page.locator('input[id*="/properties/source-input"]').inputValue(), 'email');
  await page.getByRole('tab', { name: catalog['messagesTab.label'], exact: true }).click();
  await page
    .getByText(catalog['error.errorMessage.nicknameRequired'], { exact: true })
    .first()
    .waitFor();
  await page.getByText(catalog['error.errorMessage.tooYoung'], { exact: true }).first().waitFor();
  await page.getByText('A postcode is four digits, like 1010.', { exact: true }).first().waitFor();
  assert.deepEqual(errors, []);
});
