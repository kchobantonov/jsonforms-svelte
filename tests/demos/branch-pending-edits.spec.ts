import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

// The same discarded-data/confirmation scenarios as the React renderer tests,
// exercised through the built Svelte demos and their real native controls.
demoTest('branch-pending-edits', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const selectTab = async (name: string | RegExp) => {
    const tab = page.getByRole('tab', { name, exact: typeof name === 'string' });
    await tab.click();
  };
  const apply = async (name: string, value: unknown) => {
    const label = demoEditorLabel(locale, name);
    await selectTab(label);
    const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    const input = editor.locator('.inputarea, .native-edit-context');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate((element, text) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', text);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, JSON.stringify(value));
    await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await toolbar.getByRole('button').nth(1).click();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  };
  const demo = () => selectTab(new RegExp('^' + demoEditorLabel(locale, 'Demo')));
  const expectData = async (expected: unknown) => {
    await selectTab(demoEditorLabel(locale, 'Data'));
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
      .toEqual(expected);
  };
  const settle = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  for (const mode of ['oneOf', 'mixed'] as const) {
    // Remove old controls before replacing the schema they resolve against.
    await apply('UI Schema', { type: 'VerticalLayout', elements: [] });
    await demo();
    await apply('Schema', {
      type: 'object',
      properties: {
        value:
          mode === 'oneOf'
            ? {
                oneOf: ['First', 'Second'].map((title) => ({
                  type: 'object',
                  title,
                  required: ['kind'],
                  properties: { kind: { const: title, default: title }, note: { type: 'string' } },
                })),
              }
            : { type: ['object', 'string'], properties: { note: { type: 'string' } } },
      },
    });
    await apply('Data', { value: mode === 'oneOf' ? { kind: 'First' } : {}, sibling: 'keep' });
    await apply('UI Schema', {
      type: 'Control',
      scope: '#/properties/value',
      options: {
        structuredLayout: 'nested',
        confirmation: { branchChange: 'complex', typeChange: 'complex' },
      },
    });
    await demo();
    const input = page.locator('input[id*="/properties/note"]:visible');
    await input.waitFor();
    await input.evaluate((node) => {
      node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      (node as HTMLInputElement).value = 'draft';
      node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    });
    const clearLabel =
      messages[locale][mode === 'oneOf' ? 'control.clearValue' : 'mixed.clearType'];
    const clear = () =>
      page
        .locator(`button[aria-label="${clearLabel}"]`)
        .first()
        .evaluate((node) => (node as HTMLButtonElement).click());
    const choose = async () => {
      if (family === 'flowbite') {
        await page.locator('select[id*="/properties/value"]:visible').selectOption('1');
      } else {
        const trigger =
          family === 'shadcn'
            ? page.locator('button[id*="/properties/value"][aria-haspopup="listbox"]:visible')
            : page
                .locator('input[id*="/properties/value"]:visible')
                .locator('..')
                .locator('button[aria-haspopup="listbox"]');
        await trigger.click();
        await page
          .getByRole('option', { name: mode === 'oneOf' ? 'Second' : 'string', exact: true })
          .click();
      }
    };
    await settle();
    await choose();
    await settle();
    expect(await page.getByRole('dialog').count()).toBe(0);
    expect(await input.inputValue()).toBe('draft');
    await input.evaluate((node) =>
      node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })),
    );
    await clear(); // No blur between completion and the destructive command.
    await page
      .getByRole('button', { name: messages[locale]['combinator.clearDialogDecline'], exact: true })
      .click();
    await expectData({
      value: { ...(mode === 'oneOf' ? { kind: 'First' } : {}), note: 'draft' },
      sibling: 'keep',
    });
    await demo();
    await choose();
    await page
      .getByRole('button', { name: messages[locale]['combinator.clearDialogAccept'], exact: true })
      .click();
    if (mode === 'mixed') await expect.poll(() => input.count()).toBe(0);
    else await expect.poll(() => input.inputValue()).toBe('');
    await expectData({
      value: mode === 'oneOf' ? { kind: 'Second' } : '',
      sibling: 'keep',
    });
    await demo();
    await clear();
    await settle();
    await expectData({ sibling: 'keep' });
  }
  expect(errors).toEqual([]);
});
