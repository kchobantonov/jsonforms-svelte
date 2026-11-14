import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'recursive-tree-literal-children',
  async ({ page, family, locale, webcomponent, base }) => {
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
      `${base}/${family}/#/examples/spec-recursive-tree?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const schema = {
      type: 'object',
      properties: { root: { $ref: '#/definitions/node' } },
      definitions: {
        node: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            'children.log': { type: 'array', items: { $ref: '#/definitions/node' } },
          },
        },
      },
    };
    const data = {
      root: {
        name: 'Root',
        'children.log': [
          { name: 'Child', 'children.log': [{ name: 'Grandchild', 'children.log': [] }] },
        ],
        children: { log: [{ name: 'Keep' }] },
      },
    };
    const uischema = {
      type: 'Control',
      scope: '#/properties/root',
      options: {
        recursiveTree: {
          childrenProperty: 'children.log',
          labelProperty: 'name',
        },
      },
    };
    await applyDemoEditor(
      page,
      locale,
      'UI Schema',
      { type: 'Label', text: 'Preparing recursive tree' },
      { verifyVisibleText: false },
    );
    await applyDemoEditor(page, locale, 'Schema', schema, { verifyVisibleText: false });
    await applyDemoEditor(page, locale, 'Data', data, { verifyVisibleText: false });
    await applyDemoEditor(page, locale, 'UI Schema', uischema, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();

    const tree = page.locator('[data-recursive-tree]');
    const navigation = tree.locator('[data-recursive-tree-navigation]');
    const detail = tree.locator('[data-recursive-tree-detail]');
    await navigation.getByRole('button', { name: 'Child', exact: true }).first().click();
    const name = detail.locator('input[id*="name"]');
    await expect.poll(() => name.inputValue()).toBe('Child');
    await detail.getByRole('button', { name: 'Grandchild', exact: true }).click();
    await expect.poll(() => name.inputValue()).toBe('Grandchild');
    await name.fill('Leaf');

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    const current = () =>
      lines.innerText().then((text) => JSON.parse(text.replaceAll('\u00a0', ' ')).root);
    await expect
      .poll(async () => (await current())['children.log'][0]['children.log'][0].name)
      .toBe('Leaf');
    const saved = await current();
    expect(saved.name).toBe('Root');
    expect(saved['children.log'][0].name).toBe('Child');
    expect(saved.children.log[0].name).toBe('Keep');
    expect(errors).toEqual([]);
  },
  { timeout: 90_000 },
);
