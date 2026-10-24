import { demoEditorLabel } from '../helpers/demo-labels';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import vectors from '../fixtures/spec-conformance/behavior.json';

// Configure the canonical inference demo through its public JSON editors. This
// exercises the same handoff in native and independently bundled WC runtimes.
demoTest('literal-duration', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
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
  const literal = vectors.find((vector) => vector.id === 'port-literal-key')!;
  const duration = vectors.find((vector) => vector.id === 'duration-unchanged')!;
  await apply('Schema', {
    type: 'object',
    properties: {
      'legacy.key': { type: 'string' },
      legacy: { type: 'object', properties: { key: { type: 'string' } } },
      '': { type: 'string' },
      duration: { type: 'string', format: 'duration' },
    },
  });
  await apply('UI Schema', {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/legacy.key', label: 'Literal property' },
      { type: 'Control', scope: '#/properties/duration', label: 'Duration' },
    ],
  });
  await apply('Data', { ...(literal.input.data as object), duration: duration.input.data });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  const field = page.getByRole('textbox', { name: 'Literal property', exact: true });
  await expect.poll(() => field.inputValue()).toBe('A');
  await field.fill('D');
  const durationInput = page.getByRole('combobox', { name: 'Duration', exact: true });
  await expect.poll(() => durationInput.inputValue()).toBe(duration.input.data);
  await page.getByRole('button', { name: messages[locale]['duration.open'], exact: true }).click();
  await page
    .getByRole('spinbutton', { name: messages[locale]['duration.weeks'], exact: true })
    .waitFor();
  await page.getByRole('button', { name: messages[locale]['duration.ok'], exact: true }).click();
  await expect.poll(() => durationInput.inputValue()).toBe(duration.expected.data);
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const text = page.locator('.monaco-editor:visible .view-lines');
  await expect
    .poll(async () => JSON.parse((await text.innerText()).replaceAll('\u00a0', ' ')))
    .toEqual({ ...(literal.expected.data as object), duration: duration.expected.data });
  expect(errors).toEqual([]);
});
