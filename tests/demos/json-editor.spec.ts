import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';

demoTest(
  'json-editor explicit unrestricted schema and root values',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
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
    await expect.poll(() => page.locator('.monaco-editor:visible .view-lines').innerText()).toBe('{}');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect.poll(() => page.locator('.monaco-editor:visible .view-lines').innerText()).toBe('');
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
    await expect.poll(() => page.locator('[id$="-input-selector"]').textContent()).toContain('null');
    await applyDemoEditor(page, locale, 'Data', [1, 'two', false, null]);
    await demo();
    await expect
      .poll(() =>
        page.locator('input:visible').evaluateAll((inputs) =>
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
    const name = page.getByRole('textbox', { name: 'Name', exact: true });
    await expect.poll(() => name.inputValue()).toBe('Sample');
    await name.fill('Edited');
    await name.press('Tab');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect
      .poll(() => page.locator('.monaco-editor:visible .view-lines').innerText())
      .toContain('Edited');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Schema'), exact: true }).click();
    await expect.poll(() => page.locator('.monaco-editor:visible .view-lines').innerText()).toBe('{}');
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
