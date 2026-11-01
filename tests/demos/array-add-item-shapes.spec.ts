import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-add-item-shapes',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const apply = (name: 'Schema' | 'UI Schema' | 'Data', value: unknown) =>
      applyDemoEditor(page, locale, name, value);
    const showDemo = () =>
      page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
    const addPrefix = messages[locale]['array.addAriaLabelWithLabel'].split('{label}')[0];
    const add = () => page.locator(`button[aria-label^="${addPrefix}"]:visible`).first();
    const currentData = async () => {
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      return JSON.parse(
        (await page.locator('.monaco-editor:visible .view-lines').innerText()).replaceAll(
          '\u00a0',
          ' ',
        ),
      ) as unknown;
    };

    for (const { item, definition, table, expected } of [
      { item: { type: 'null' }, table: true, expected: [null] },
      {
        item: { type: 'array', items: { type: 'string' } },
        table: false,
        expected: [[]],
      },
      {
        item: { $ref: '#/$defs/Item' },
        definition: { type: 'null' },
        table: true,
        expected: [null],
      },
      {
        item: { $ref: '#/$defs/Item' },
        definition: { type: 'array', items: { type: 'string' } },
        table: false,
        expected: [[]],
      },
      {
        item: {
          oneOf: [
            { type: 'object', properties: { flag: { type: 'boolean', default: true } } },
            { type: 'string' },
          ],
        },
        table: false,
        expected: [{ flag: true }],
      },
      {
        item: { $ref: '#/$defs/Item' },
        definition: {
          oneOf: [
            { type: 'object', properties: { flag: { type: 'boolean', default: true } } },
            { type: 'string' },
          ],
        },
        table: false,
        expected: [{ flag: true }],
      },
    ]) {
      await apply('Schema', {
        type: 'array',
        title: 'Values',
        ...(definition ? { $defs: { Item: definition } } : {}),
        items: item,
      });
      await apply('UI Schema', { type: 'Control', scope: '#', options: { table } });
      await apply('Data', []);
      await showDemo();
      await add().click();
      await expect.poll(currentData).toEqual(expected);
    }

    await apply('Schema', {
      type: 'array',
      title: 'Values',
      minItems: 1,
      items: { type: 'string' },
    });
    await apply('UI Schema', {
      type: 'Control',
      scope: '#',
      options: { table: false, restrict: true, confirmation: { delete: 'never' } },
    });
    await apply('Data', ['first']);
    await showDemo();
    const remove = page.getByRole('button', {
      name: messages[locale]['array.removeAriaLabel'],
      exact: true,
    });
    expect(await remove.isDisabled()).toBe(true);

    await apply('UI Schema', {
      type: 'Control',
      scope: '#',
      options: { table: false, restrict: false, confirmation: { delete: 'never' } },
    });
    await showDemo();
    expect(await remove.isDisabled()).toBe(false);
    await remove.click();
    await expect.poll(currentData).toEqual([]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 120_000 },
);
