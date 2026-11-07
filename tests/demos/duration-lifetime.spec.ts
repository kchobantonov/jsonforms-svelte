import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('duration-lifetime', async ({ page, family, locale, webcomponent, base }) => {
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
      (element, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
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
    properties: { value: { type: 'string' } },
  });
  await apply('UI Schema', {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/value',
        label: 'Duration',
        options: { format: 'duration' },
      },
      { type: 'Control', scope: '#/properties/value', label: 'Host value' },
    ],
  });
  await apply('Config', {});
  await apply('Data', { value: 'P1D' });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  const duration = page.getByRole('combobox', { name: 'Duration', exact: true });
  const host = page.getByRole('textbox', { name: 'Host value', exact: true });
  await duration.fill('P2D');
  await duration.blur();
  await expect.poll(() => host.inputValue()).toBe('P2D');
  await host.fill('P3D');
  await host.blur();
  await expect.poll(() => duration.inputValue()).toBe('P3D');
  await duration.fill('P-');
  await duration.blur();
  await expect.poll(() => duration.getAttribute('aria-invalid')).toBe('true');
  await expect.poll(() => host.inputValue()).toBe('P3D');
  await host.fill('P2D');
  await host.blur();
  await expect.poll(() => duration.inputValue()).toBe('P2D');
  await expect.poll(() => duration.getAttribute('aria-invalid')).toBe('false');
  expect(errors).toEqual([]);
});
