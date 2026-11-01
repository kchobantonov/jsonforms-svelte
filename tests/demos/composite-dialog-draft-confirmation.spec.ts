import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import initialData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'composite-dialog-draft-confirmation',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/compositeRows',
      options: {
        table: true,
        cells: {
          object: { showRemoveButton: true },
          array: { showEmptyButton: true },
        },
      },
    });
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    const cells = page.locator('[data-composite-cell]');
    await expect.poll(() => cells.count()).toBe(4);
    const array = cells.nth(1);
    const initialArraySummary = await array.locator('[data-composite-summary]').textContent();
    await array.getByRole('button').first().click();
    const clear = page.getByRole('button', {
      name: messages[locale]['composite.empty'],
      exact: true,
    });
    const confirmation = page.getByRole('dialog', {
      name: translations[locale]['confirm.delete.title'],
      exact: true,
    });
    await clear.click();
    await expect.poll(() => confirmation.isVisible()).toBe(true);
    await confirmation
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => confirmation.count()).toBe(0);
    expect(await array.locator('[data-composite-summary]').textContent()).toBe(initialArraySummary);
    await clear.click();
    await confirmation
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    expect(await array.locator('[data-composite-summary]').textContent()).toBe(initialArraySummary);
    await page
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();

    const object = cells.first();
    const initialObjectSummary = await object.locator('[data-composite-summary]').textContent();
    await object.getByRole('button').first().click();
    await page
      .getByRole('button', { name: messages[locale]['composite.remove'], exact: true })
      .click();
    await expect.poll(() => confirmation.isVisible()).toBe(true);
    await confirmation
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    expect(await object.locator('[data-composite-summary]').textContent()).toBe(
      initialObjectSummary,
    );
    await page
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const dataEditor = page.locator('.monaco-editor:visible');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const expected = structuredClone(initialData) as {
      compositeRows: { object?: unknown; array: unknown[] }[];
    };
    expected.compositeRows[0].array = [];
    delete expected.compositeRows[0].object;
    await expect
      .poll(async () => {
        await dataEditor.locator('.inputarea, .native-edit-context').focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
);
