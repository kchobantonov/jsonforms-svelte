import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import sourceUi from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/uischema.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('recursive-tree-detail', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-recursive-tree?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const ui = structuredClone(sourceUi) as unknown as {
    elements: { elements: { options?: { recursiveTree?: { detail?: unknown } } }[] }[];
  };
  const treeControl = ui.elements[3].elements[0];
  treeControl.options!.recursiveTree!.detail = 'REGISTERED';
  await applyDemoEditor(page, locale, 'UI Schema', ui, { verifyVisibleText: false });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page
    .getByRole('tab', { name: translations[locale]['tree.editor.label'], exact: true })
    .click();

  const tree = page.locator('[data-recursive-tree]');
  const pane = tree.locator('[data-recursive-tree-detail]');
  const navigation = tree.locator('[data-recursive-tree-navigation]');
  const name = pane.getByRole('textbox', {
    name: translations[locale]['tree.name.label'],
    exact: false,
  });
  const addName = messages[locale]['array.addAriaLabelWithLabel'].replace(
    '{label}',
    translations[locale]['tree.children.label'],
  );
  await expect.poll(() => name.inputValue()).toBe('Documents');
  await expect
    .poll(() => pane.getByRole('button', { name: addName, exact: true }).count())
    .toBeGreaterThan(0);
  await navigation.getByRole('button', { name: 'readme.txt', exact: true }).first().click();
  await expect.poll(() => name.inputValue()).toBe('readme.txt');
  const content = pane.getByRole('textbox', {
    name: translations[locale]['tree.content.label'],
    exact: false,
  });
  await expect.poll(() => content.inputValue()).toBe('Welcome');
  await expect.poll(() => pane.getByRole('button', { name: addName, exact: true }).count()).toBe(0);
  await navigation
    .locator('[data-recursive-node]')
    .filter({ hasText: /^Archive$/ })
    .click();
  await expect.poll(() => name.inputValue()).toBe('Archive');
  await expect.poll(() => content.count()).toBe(0);
  await expect
    .poll(() => pane.getByRole('button', { name: addName, exact: true }).count())
    .toBeGreaterThan(0);
  expect(await pane.innerText()).not.toContain('No applicable renderer');
  expect(errors).toEqual([]);
});

demoTest('recursive-tree-readonly', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-recursive-tree?read-only=true&use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', { name: translations[locale]['tree.editor.label'], exact: true })
    .click();

  const tree = page.locator('[data-recursive-tree]');
  const pane = tree.locator('[data-recursive-tree-detail]');
  const navigation = tree.locator('[data-recursive-tree-navigation]');
  const name = pane.getByRole('textbox', {
    name: translations[locale]['tree.name.label'],
    exact: false,
  });
  await expect.poll(() => name.inputValue()).toBe('Documents');
  await expect.poll(() => name.isEditable()).toBe(false);
  const addName = messages[locale]['array.addAriaLabelWithLabel'].replace(
    '{label}',
    translations[locale]['tree.children.label'],
  );
  const add = pane.getByRole('button', { name: addName, exact: true });
  await expect
    .poll(async () => (await add.count()) === 0 || (await add.first().isDisabled()))
    .toBe(true);
  await navigation.getByRole('button', { name: 'readme.txt', exact: true }).first().click();
  await expect.poll(() => name.inputValue()).toBe('readme.txt');
  await expect.poll(() => name.isEditable()).toBe(false);
  await expect
    .poll(() =>
      navigation
        .getByRole('button', {
          name: `${messages[locale]['mixed.rename']} readme.txt`,
          exact: true,
        })
        .count(),
    )
    .toBe(0);
  await expect
    .poll(() =>
      navigation
        .getByRole('button', {
          name: `${messages[locale]['mixed.delete']} readme.txt`,
          exact: true,
        })
        .count(),
    )
    .toBe(0);
  expect(errors).toEqual([]);
});
