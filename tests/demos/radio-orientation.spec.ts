import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('radio-orientation', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
  );

  async function apply(name: string, value: unknown) {
    await page.getByRole('tab', { name: demoEditorLabel(locale, name), exact: true }).click();
    const toolbar = page
      .getByRole('heading', { name: demoEditorLabel(locale, name), exact: true })
      .locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    const input = editor.locator('.inputarea, .native-edit-context');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate(
      (element, value) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', value);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      },
      JSON.stringify(value, null, 2),
    );
    await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await toolbar.getByRole('button').nth(1).click();
  }

  await apply('Schema', {
    type: 'object',
    properties: {
      enumChoice: { type: 'string', enum: ['A', 'B'] },
      oneOfChoice: {
        type: 'string',
        oneOf: [
          { const: 'X', title: 'X' },
          { const: 'Y', title: 'Y' },
        ],
      },
      checkboxDefault: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', enum: ['A', 'B'] },
      },
      checkboxVertical: {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string', enum: ['A', 'B'] },
      },
    },
  });
  await apply('UI Schema', {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/enumChoice', options: { format: 'radio' } },
      {
        type: 'Control',
        scope: '#/properties/oneOfChoice',
        options: { format: 'radio', vertical: false },
      },
      { type: 'Control', scope: '#/properties/checkboxDefault' },
      { type: 'Control', scope: '#/properties/checkboxVertical', options: { vertical: true } },
    ],
  });
  await apply('Config', { vertical: true, jsonformsExtended: { radio: { vertical: true } } });
  await apply('Data', {
    enumChoice: 'A',
    oneOfChoice: 'X',
    checkboxDefault: [],
    checkboxVertical: [],
  });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  const orientation = page.locator('[data-radio-orientation]');
  await expect.poll(() => orientation.count()).toBe(2);
  await expect
    .poll(() => orientation.first().getAttribute('data-radio-orientation'))
    .toBe('vertical');
  await expect
    .poll(() => orientation.nth(1).getAttribute('data-radio-orientation'))
    .toBe('horizontal');
  if (family === 'shadcn') {
    const unchecked = orientation.first().getByRole('radio').nth(1);
    expect(await unchecked.isChecked()).toBe(false);
    await expect
      .poll(() =>
        unchecked.evaluate((node) => {
          const token = document.createElement('span');
          token.style.borderColor = 'hsl(var(--input))';
          node.append(token);
          const matches =
            getComputedStyle(node).borderColor === getComputedStyle(token).borderColor;
          token.remove();
          return matches;
        }),
      )
      .toBe(true);
  }
  const checkboxDirections = () =>
    page
      .getByRole('checkbox')
      .evaluateAll((checkboxes) =>
        [...new Set(checkboxes.map((checkbox) => checkbox.closest('[role="group"]')))].map(
          (group) => (group ? getComputedStyle(group).flexDirection : ''),
        ),
      );
  await expect.poll(checkboxDirections).toEqual(['row', 'column']);

  await apply('Config', { vertical: true });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await expect
    .poll(() => orientation.first().getAttribute('data-radio-orientation'))
    .toBe('horizontal');
  await expect
    .poll(() => orientation.nth(1).getAttribute('data-radio-orientation'))
    .toBe('horizontal');
  await expect.poll(checkboxDirections).toEqual(['row', 'column']);
  expect(errors).toEqual([]);
});
