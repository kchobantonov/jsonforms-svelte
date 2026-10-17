import assert from 'node:assert/strict';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('recursive-tree', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-recursive-tree?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', { name: translations[locale]['tree.editor.label'], exact: true })
    .click();
  const tree = page.locator('[data-recursive-tree]');
  const detail = tree.locator('[data-recursive-tree-detail]');
  const navigation = tree.locator('[data-recursive-tree-navigation]');
  await navigation.getByRole('button', { name: 'readme.txt', exact: true }).click();
  const name = detail.getByRole('textbox', {
    name: translations[locale]['tree.name.label'],
    exact: false,
  });
  await expect.poll(() => name.inputValue()).toBe('readme.txt');
  await name.fill('updated.txt');
  await navigation.getByRole('button', { name: 'updated.txt', exact: true }).waitFor();
  await navigation
    .locator('[data-recursive-node]')
    .filter({ hasText: /^Archive$/ })
    .click();
  await expect.poll(() => name.inputValue()).toBe('Archive');
  await navigation.getByRole('button', { name: 'updated.txt', exact: true }).click();
  await navigation
    .getByRole('button', { name: `${messages[locale]['mixed.rename']} updated.txt`, exact: true })
    .click();
  await navigation
    .getByRole('textbox', { name: messages[locale]['mixed.rename'], exact: true })
    .fill('renamed.txt');
  await navigation
    .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
    .click();
  await expect.poll(() => name.inputValue()).toBe('renamed.txt');
  await navigation
    .getByRole('button', { name: `${messages[locale]['mixed.delete']} renamed.txt`, exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
    .click();
  await expect.poll(() => name.inputValue()).toBe('Documents');
  assert.equal(
    await navigation.getByRole('button', { name: 'renamed.txt', exact: true }).count(),
    0,
  );
  assert.equal(
    await navigation
      .locator('[data-recursive-node]')
      .filter({ hasText: /^Archive$/ })
      .count(),
    1,
  );
  assert.deepEqual(errors, []);
});
