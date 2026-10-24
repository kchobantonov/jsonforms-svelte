import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-properties/translations.json';

demoTest('additional-properties', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const bracket = page.getByRole('textbox', { name: 'items[0]', exact: true });
  await expect.poll(() => bracket.inputValue()).toBe('crate');
  await bracket.fill('Edited bracket key');
  const empty = page.getByRole('textbox', { name: '', exact: true });
  assert.equal(await empty.inputValue(), 'unnamed label');
  await empty.fill('Edited empty key');
  const imported = page.getByRole('tab', {
    name: translations[locale]['featureNavigation.section2.label'],
    exact: true,
  });
  const dynamic = page.getByRole('tab', {
    name: translations[locale]['featureNavigation.section1.label'],
    exact: true,
  });
  await imported.click();
  const dotted = page.getByRole('textbox', { name: 'legacy.key', exact: true });
  assert.equal(await dotted.inputValue(), 'written by the old project system');
  await dotted.fill('Edited literal dot');
  assert.equal(
    await page.getByRole('textbox', { name: 'notes/1', exact: true }).inputValue(),
    'a slash is an ordinary character in a key',
  );
  await dynamic.click();
  await expect.poll(() => bracket.inputValue()).toBe('Edited bracket key');
  assert.equal(await empty.inputValue(), 'Edited empty key');
  assert.equal(
    await page.getByRole('textbox', { name: '2024', exact: true }).inputValue(),
    'season',
  );
  await imported.click();
  await expect.poll(() => dotted.inputValue()).toBe('Edited literal dot');
  assert.deepEqual(errors, []);
});
