import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import schema from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/schema.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'ag-grid-commands',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', { name: translations[locale]['gridTab.label'], exact: true })
      .click();
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['gridTab.label'],
      exact: true,
    });
    const grid = panel.locator('.ag-root');
    const rows = () => grid.locator('.ag-row[row-index]');
    const code = (index: number) =>
      grid.locator(`.ag-row[row-index="${index}"] .ag-cell[col-id="code"] input`);
    await code(0).waitFor();
    const originalEditor = await code(0).elementHandle();
    const originalRowKey = await rows().nth(0).getAttribute('row-id');
    const addLabel = messages[locale]['array.addAriaLabelWithLabel'].split('{label}');
    const add = panel.locator(
      `button[aria-label^="${addLabel[0]}"]${addLabel[1] ? `[aria-label$="${addLabel[1]}"]` : ''}`,
    );
    await code(0).evaluate((node) => {
      node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      (node as HTMLInputElement).value = 'Draft ticket';
      node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    });
    await add.evaluate((node) => (node as HTMLButtonElement).click());
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(await rows().count()).toBe(2);
    await code(0).evaluate((node) =>
      node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })),
    );
    const handle = grid.locator('.ag-row[row-index="0"] .ag-drag-handle');
    const source = (await handle.boundingBox())!;
    const target = (await rows().nth(1).boundingBox())!;
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(source.x + source.width / 2, target.y + target.height / 2, { steps: 10 });
    await page.mouse.up();
    // Native hosts may finish the grid's post-drag refresh after the default
    // one-second poll budget. Assert the final row values before the next action.
    await expect.poll(() => code(1).inputValue(), { timeout: 5000 }).toBe('Draft ticket');
    expect(await grid.locator('.ag-row[row-index="1"]').getAttribute('row-id')).toBe(
      originalRowKey,
    );
    expect(await code(1).evaluate((node, original) => node === original, originalEditor)).toBe(
      true,
    );
    await expect.poll(() => code(0).inputValue()).toBe('EARLY-2');
    await grid.locator('.ag-row[row-index="0"] .ag-selection-checkbox input').check();
    const remove = panel.getByRole('button', {
      name: messages[locale]['array.removeAriaLabel'],
      exact: true,
    });
    await remove.click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: messages[locale]['confirm.decline'], exact: true })
      .click();
    expect(await rows().count()).toBe(2);
    await remove.click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
      .click();
    await expect.poll(() => rows().count()).toBe(1);
    await expect.poll(() => code(0).inputValue()).toBe('Draft ticket');
    await add.evaluate((node) => {
      (node as HTMLButtonElement).click();
      (node as HTMLButtonElement).click();
    });
    await expect.poll(() => rows().count()).toBe(2);
    const expected = {
      ...structuredClone(original),
      tickets: [{ ...structuredClone(original.tickets[0]), code: 'Draft ticket' }, {}],
    };
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page
          .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
          .focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);

    await applyDemoEditor(page, locale, 'Schema', {
      ...schema,
      properties: {
        ...schema.properties,
        tickets: { ...schema.properties.tickets, minItems: 2 },
      },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', { name: translations[locale]['gridTab.label'], exact: true })
      .click();
    await grid.locator('.ag-row[row-index="0"] .ag-selection-checkbox input').check();
    await expect.poll(() => remove.isDisabled()).toBe(true);

    await applyDemoEditor(page, locale, 'Config', {
      showUnfocusedDescription: true,
      restrict: false,
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', { name: translations[locale]['gridTab.label'], exact: true })
      .click();
    await grid.locator('.ag-row[row-index="0"] .ag-selection-checkbox input').check();
    await expect.poll(() => remove.isDisabled()).toBe(false);
    await remove.click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
      .click();
    await expect.poll(() => rows().count()).toBe(1);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    expected.tickets.shift();
    await expect
      .poll(async () => {
        await page
          .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
          .focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 60_000 },
);
