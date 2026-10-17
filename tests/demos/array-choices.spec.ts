import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-choices/translations.json';
import supplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-choices/supplemental-translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('array-choices', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-array-choices?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const catalog = translations[locale];
  const remove = (value: string) =>
    messages[locale]['arrayChoices.remove'].replace('{label}', value);
  await page
    .getByRole('tab', { name: catalog['featureNavigation.section2.label'], exact: true })
    .click();
  const codes = page.getByRole('button', { name: remove('A-117'), exact: true });
  assert.equal(await codes.count(), 2);
  await codes.first().click();
  await codes.first().waitFor();
  assert.equal(await codes.count(), 1);
  const tags = page.locator('input[id*="/properties/tags"]:visible');
  await tags.fill('new-tag');
  await tags.press('Enter');
  await page.getByRole('button', { name: remove('new-tag'), exact: true }).waitFor();
  await page
    .locator('label:visible')
    .filter({ hasText: supplements[locale]['tags.label'] })
    .first()
    .waitFor();
  await page
    .getByRole('tab', { name: catalog['featureNavigation.section3.label'], exact: true })
    .click();
  assert.equal(
    await page.getByRole('button', { name: remove('Dover'), exact: true }).isDisabled(),
    true,
  );
  const imported = page.getByRole('button', { name: remove('Fax'), exact: true });
  await imported.focus();
  await imported.press('Enter');
  await imported.waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
});
