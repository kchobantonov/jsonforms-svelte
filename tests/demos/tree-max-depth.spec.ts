import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/translations.json';
import sourceData from '@chobantonov/jsonforms-extended-spec/examples/tree-max-depth/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('tree-max-depth', async ({ page, family, locale, webcomponent, base }) => {
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

  const imported = structuredClone(sourceData);
  Reflect.set(imported.tree.children[0].children[0].children[0].children[0], 'children', [
    { kind: 'file', name: 'Imported level 6', content: 'Keep this imported file' },
  ]);
  await applyDemoEditor(page, locale, 'Data', imported, { verifyVisibleText: false });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await expect.poll(() => names.count()).toBe(5);
  const maxItemsError = page.getByText(
    locale === 'bg' ? /не трябва да има повече от 0 елемента/ : /must NOT have more than 0 items/,
  );
  await expect.poll(() => maxItemsError.count()).toBeGreaterThan(0);
  await expect.poll(() => adds.count()).toBe(5);
  assert.equal(await adds.last().isDisabled(), true);

  await applyDemoEditor(page, locale, 'Data', sourceData, { verifyVisibleText: false });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await expect.poll(() => maxItemsError.count()).toBe(0);
  await expect.poll(() => names.count()).toBe(5);
  assert.deepEqual(errors, []);
});
