import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('literal rule context', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const applyJson = (name: Parameters<typeof applyDemoEditor>[2], value: unknown) =>
    applyDemoEditor(page, locale, name, value, { verifyVisibleText: false });
  await applyJson('Schema', {
    type: 'object',
    properties: {
      'a.b': { type: 'string', title: 'Literal key' },
      '': { type: 'string', title: 'Empty key' },
      'a~b~c': { type: 'string', title: 'Escaped key' },
      'a~b~0c': { type: 'string', title: 'Escaped decoy' },
      a: { type: 'object', properties: { b: { type: 'string', title: 'Nested key' } } },
      target: { type: 'string', title: 'Target' },
      emptyTarget: { type: 'string', title: 'Empty target' },
      escapedTarget: { type: 'string', title: 'Escaped target' },
    },
  });
  await applyJson('UI Schema', {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/a.b' },
      { type: 'Control', scope: '#/properties/' },
      { type: 'Control', scope: '#/properties/a~0b~0c' },
      { type: 'Control', scope: '#/properties/a~0b~00c' },
      { type: 'Control', scope: '#/properties/a/properties/b' },
      {
        type: 'Control',
        scope: '#/properties/target',
        rule: {
          effect: 'SHOW',
          condition: { scope: '#/properties/a.b', schema: { const: 'show' } },
        },
      },
      {
        type: 'Control',
        scope: '#/properties/emptyTarget',
        rule: {
          effect: 'SHOW',
          condition: { scope: '#/properties/', schema: { const: 'open' } },
        },
      },
      {
        type: 'Control',
        scope: '#/properties/escapedTarget',
        rule: {
          effect: 'SHOW',
          condition: { scope: '#/properties/a~0b~0c', schema: { const: 'show' } },
        },
      },
    ],
  });
  await applyJson('Data', {
    'a.b': 'show',
    '': 'open',
    'a~b~c': 'show',
    'a~b~0c': 'hide',
    a: { b: 'hide' },
    target: 'visible',
    emptyTarget: 'also visible',
    escapedTarget: 'escaped visible',
  });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();

  const literal = page.getByRole('textbox', { name: 'Literal key', exact: true });
  const nested = page.getByRole('textbox', { name: 'Nested key', exact: true });
  const target = page.getByRole('textbox', { name: 'Target', exact: true });
  const empty = page.getByRole('textbox', { name: 'Empty key', exact: true });
  const emptyTarget = page.getByRole('textbox', { name: 'Empty target', exact: true });
  const escaped = page.getByRole('textbox', { name: 'Escaped key', exact: true });
  const decoy = page.getByRole('textbox', { name: 'Escaped decoy', exact: true });
  const escapedTarget = page.getByRole('textbox', { name: 'Escaped target', exact: true });
  await expect.poll(() => literal.inputValue()).toBe('show');
  await expect.poll(() => empty.inputValue()).toBe('open');
  await expect.poll(() => nested.inputValue()).toBe('hide');
  await expect.poll(() => target.inputValue()).toBe('visible');
  await expect.poll(() => emptyTarget.inputValue()).toBe('also visible');
  await expect.poll(() => escaped.inputValue()).toBe('show');
  await expect.poll(() => decoy.inputValue()).toBe('hide');
  await expect.poll(() => escapedTarget.inputValue()).toBe('escaped visible');

  await nested.fill('show');
  await nested.press('Tab');
  await expect.poll(() => target.count()).toBe(1);
  await literal.fill('hide');
  await literal.press('Tab');
  await expect.poll(() => target.count()).toBe(0);
  await literal.fill('show');
  await literal.press('Tab');
  await expect.poll(() => target.inputValue()).toBe('visible');
  await empty.fill('closed');
  await empty.press('Tab');
  await expect.poll(() => emptyTarget.count()).toBe(0);
  await empty.fill('open');
  await empty.press('Tab');
  await expect.poll(() => emptyTarget.inputValue()).toBe('also visible');
  await decoy.fill('show');
  await decoy.press('Tab');
  await expect.poll(() => escapedTarget.count()).toBe(1);
  await escaped.fill('hide');
  await escaped.press('Tab');
  await expect.poll(() => escapedTarget.count()).toBe(0);
  await escaped.fill('show');
  await escaped.press('Tab');
  await expect.poll(() => escapedTarget.inputValue()).toBe('escaped visible');

  await applyJson('Schema', {
    type: 'object',
    properties: {
      records: {
        type: 'array',
        title: 'Records',
        items: {
          type: 'object',
          properties: {
            'a.b': { type: 'string', title: 'Item literal' },
            a: { type: 'object', properties: { b: { type: 'string', title: 'Item nested' } } },
            target: { type: 'string', title: 'Item target' },
          },
        },
      },
    },
  });
  await applyJson('UI Schema', {
    type: 'Control',
    scope: '#/properties/records',
    options: {
      collapsed: false,
      detail: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/a.b' },
          { type: 'Control', scope: '#/properties/a/properties/b' },
          {
            type: 'Control',
            scope: '#/properties/target',
            rule: {
              effect: 'SHOW',
              condition: { scope: '#/properties/a.b', schema: { const: 'show' } },
            },
          },
        ],
      },
    },
  });
  await applyJson('Data', {
    records: [
      { 'a.b': 'show', a: { b: 'hide' }, target: 'first target' },
      { 'a.b': 'hide', a: { b: 'show' }, target: 'second target' },
    ],
  });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  const itemLiteral = page.getByRole('textbox', { name: 'Item literal', exact: true });
  const itemNested = page.getByRole('textbox', { name: 'Item nested', exact: true });
  const itemTarget = page.getByRole('textbox', { name: 'Item target', exact: true });
  const itemToggles = page.locator('button[aria-expanded]:has([data-array-avatar])');
  await expect.poll(() => itemToggles.count()).toBe(2);
  await expect.poll(() => itemLiteral.count()).toBe(1);
  await expect.poll(() => itemLiteral.inputValue()).toBe('show');
  await expect.poll(() => itemNested.inputValue()).toBe('hide');
  await expect.poll(() => itemTarget.count()).toBe(1);
  await expect.poll(() => itemTarget.inputValue()).toBe('first target');
  await itemNested.fill('show');
  await itemNested.press('Tab');
  await expect.poll(() => itemTarget.inputValue()).toBe('first target');
  await itemLiteral.fill('hide');
  await itemLiteral.press('Tab');
  await expect.poll(() => itemTarget.count()).toBe(0);
  await itemToggles.nth(1).click();
  await expect.poll(() => itemLiteral.inputValue()).toBe('hide');
  await expect.poll(() => itemNested.inputValue()).toBe('show');
  await expect.poll(() => itemTarget.count()).toBe(0);
  await itemLiteral.fill('show');
  await itemLiteral.press('Tab');
  await expect.poll(() => itemTarget.inputValue()).toBe('second target');

  await applyJson('Data', {
    records: [
      { 'a.b': 'show', a: { b: 'show' }, target: 'second target' },
      { 'a.b': 'hide', a: { b: 'show' }, target: 'first target' },
    ],
  });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  if ((await itemToggles.nth(0).getAttribute('aria-expanded')) === 'false')
    await itemToggles.nth(0).click();
  await expect.poll(() => itemLiteral.inputValue()).toBe('show');
  await expect.poll(() => itemTarget.inputValue()).toBe('second target');
  await itemToggles.nth(1).click();
  await expect.poll(() => itemLiteral.inputValue()).toBe('hide');
  await expect.poll(() => itemTarget.count()).toBe(0);
  expect(errors).toEqual([]);
});
