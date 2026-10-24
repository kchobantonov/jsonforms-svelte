import assert from 'node:assert/strict';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-tree-max-depth/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('tree-max-depth', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-tree-max-depth?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const addName = messages[locale]['array.addAriaLabelWithLabel'].replace(
    '{label}',
    translations[locale]['tree.children.label'],
  );
  const adds = page.getByRole('button', { name: addName, exact: true });
  await expect.poll(() => adds.count()).toBe(5);
  assert.equal(await adds.last().isDisabled(), true);
  assert.equal(await adds.first().isDisabled(), false);
  const names = page.getByRole('textbox', {
    // Required fields may include an asterisk in their accessible name.
    name: new RegExp(`^${translations[locale]['tree.name.label']}\\s*\\*?$`),
  });
  await expect.poll(() => names.count()).toBe(5);
  await names.last().fill('Edited level 5');
  await expect.poll(() => names.last().inputValue()).toBe('Edited level 5');
  assert.equal(await names.first().inputValue(), 'Level 1');
  assert.deepEqual(errors, []);
});
