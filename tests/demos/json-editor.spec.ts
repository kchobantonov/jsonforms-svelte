import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'json-editor explicit unrestricted schema and root values',
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
      `${base}/${family}/#/examples/spec-json-editor?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const demo = async () =>
      page.getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) }).click();
    const rootLabel = locale === 'bg' ? 'JSON стойност' : 'JSON value';
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Schema'), exact: true }).click();
    await expect
      .poll(() => page.locator('.monaco-editor:visible .view-lines').innerText())
      .toBe('{}');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect
      .poll(() => page.locator('.monaco-editor:visible .view-lines').innerText())
      .toBe('');
    await demo();
    await page.locator('[id$="-input-selector"]').waitFor();

    await applyDemoEditor(page, locale, 'Data', 'hello');
    await demo();
    await expect.poll(() => page.getByLabel(rootLabel, { exact: true }).inputValue()).toBe('hello');
    await applyDemoEditor(page, locale, 'Data', 1.5);
    await demo();
    await expect.poll(() => page.getByLabel(rootLabel, { exact: true }).inputValue()).toBe('1.5');
    await applyDemoEditor(page, locale, 'Data', false);
    await demo();
    await expect.poll(() => page.getByRole('checkbox').first().isChecked()).toBe(false);
    await applyDemoEditor(page, locale, 'Data', null);
    await demo();
    await expect
      .poll(() =>
        page
          .locator('[id$="-input-selector"]')
          .first()
          .evaluate((element) =>
            element instanceof HTMLInputElement
              ? element.value
              : element instanceof HTMLSelectElement
                ? element.selectedOptions[0]?.textContent
                : element.textContent,
          ),
      )
      .toContain('null');
    await applyDemoEditor(page, locale, 'Data', [1, 'two', false, null]);
    await demo();
    await page
      .locator('button:visible')
      .filter({ hasText: messages[locale]['collection.itemLabel'].replace('{index}', '2') })
      .first()
      .click();
    await expect
      .poll(() =>
        page
          .locator('input:visible')
          .evaluateAll((inputs) =>
            inputs.some((input) => (input as HTMLInputElement).value === 'two'),
          ),
      )
      .toBe(true);
    const sample = {
      name: 'Sample',
      active: true,
      count: 2,
      tags: ['one', 'two'],
      address: { city: 'Portland' },
      note: null,
    };
    await applyDemoEditor(page, locale, 'Data', sample);
    await demo();
    const name = page.getByRole('textbox', { name: /^name$/i });
    await expect.poll(() => name.inputValue()).toBe('Sample');
    await name.fill('Edited');
    await name.press('Tab');
    const root = page.getByRole('tree').getByRole('treeitem').first();
    if ((await root.getAttribute('aria-expanded')) === 'false') {
      if (family === 'flowbite')
        await root
          .locator(
            '[role="button"][aria-label^="Expand "], [role="button"][aria-label^="Разгъване на "]',
          )
          .first()
          .click();
      else if (family === 'skeleton')
        await root.locator('[data-part="branch-control"]').first().click();
      else await root.locator('button').first().click();
    }
    const address = page.getByRole('treeitem').filter({ hasText: 'address' }).last();
    await address.evaluate((node, family) => {
      const item = node as HTMLElement;
      (family === 'flowbite' ? item.querySelector<HTMLButtonElement>('button')! : item).click();
    }, family);
    const city = page.getByRole('textbox', { name: /^city$/i });
    await expect.poll(() => city.inputValue()).toBe('Portland');
    await city.fill('Salem');
    await city.press('Tab');
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
      .toEqual({ ...sample, name: 'Edited', address: { city: 'Salem' } });
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Schema'), exact: true }).click();
    await expect
      .poll(() => page.locator('.monaco-editor:visible .view-lines').innerText())
      .toBe('{}');
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
