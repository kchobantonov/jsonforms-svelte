import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import labels from '@chobantonov/jsonforms-extended-spec/examples/editor-details/translations.json';

demoTest('mixed-recursive-root-detail', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-editor-details?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const schema = {
    $id: 'https://example.com/recursive-meta-schema',
    type: ['object', 'boolean'],
    properties: {
      name: { type: 'string' },
      properties: { type: 'object', additionalProperties: { $ref: '#' } },
    },
  };
  const data = { name: 'Root', properties: { child: { name: 'Nested', properties: {} } } };
  await applyDemoEditor(page, locale, 'Schema', schema, { verifyVisibleText: false });
  await applyDemoEditor(page, locale, 'Data', data, { verifyVisibleText: false });
  await applyDemoEditor(
    page,
    locale,
    'UI Schema',
    { type: 'Control', scope: '#' },
    { verifyVisibleText: false },
  );
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();

  const tree = page.getByRole('tree').first();
  await expect.poll(() => tree.count()).toBe(1);
  const root = tree.getByRole('treeitem').first();
  if ((await root.getAttribute('aria-expanded')) === 'false') {
    if (family === 'flowbite')
      await root
        .locator(
          '[role="button"][aria-label^="Expand "], [role="button"][aria-label^="Разгъване на "]',
        )
        .click();
    else if (family === 'skeleton')
      await root.locator('[data-part="branch-control"]').first().click();
    else await root.locator('button').first().click();
  }
  await expect.poll(() => tree.getByRole('treeitem').count()).toBeGreaterThan(1);
  const properties = tree.getByRole('treeitem').filter({ hasText: 'properties' }).last();
  if ((await properties.getAttribute('aria-expanded')) === 'false') {
    if (family === 'flowbite')
      await properties
        .locator(
          '[role="button"][aria-label^="Expand "], [role="button"][aria-label^="Разгъване на "]',
        )
        .click();
    else if (family === 'skeleton')
      await properties.locator('[data-part="branch-control"]').first().click();
    else await properties.locator('button').first().click();
  }
  const child = tree.getByRole('treeitem').filter({ hasText: 'child' }).last();
  await child.click();
  const registeredName = page.getByRole('textbox', {
    name: labels[locale]['detailExample.registeredName.label'],
  });
  await expect.poll(() => registeredName.inputValue()).toBe('Nested');
  await registeredName.fill('Updated nested');
  await expect.poll(() => registeredName.inputValue()).toBe('Updated nested');
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const dataText = page.locator('.monaco-editor:visible .view-lines');
  await expect
    .poll(async () => JSON.parse((await dataText.innerText()).replaceAll('\u00a0', ' ')))
    .toEqual({ name: 'Root', properties: { child: { name: 'Updated nested', properties: {} } } });
  expect(errors).toEqual([]);
});
