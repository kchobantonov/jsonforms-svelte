import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import sourceData from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/data.json';

demoTest(
  'metaschema-boolean-schema',
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
      `${base}/${family}/#/examples/spec-draft-07-metaschema?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const title = page.getByRole('textbox', { name: 'Title', exact: true }).first();
    await expect.poll(() => title.inputValue(), { timeout: 10_000 }).toBe('Inventory item');
    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    const input = editor.locator('.inputarea, .native-edit-context');
    const document = structuredClone(sourceData) as { properties: Record<string, unknown> };
    document.properties.quantity = false;
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate((element, value) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', value);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, JSON.stringify(document));
    await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await toolbar.getByRole('button').nth(1).click();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const quantity = page.getByRole('checkbox', { name: 'quantity', exact: true });
    await expect.poll(() => quantity.count()).toBe(1);
    await quantity.click();
    await quantity.click();
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    await page.locator('.monaco-editor:visible').evaluate((node) => {
      (node.parentElement as HTMLElement).style.height = '3000px';
    });
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
      .toMatchObject(document);
    expect(errors).toEqual([]);
  },
  { timeout: 40_000 },
);
