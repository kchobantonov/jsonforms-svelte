import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import labels from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest(
  'demo-schema-editor-lifecycle',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.locator('input[id*="/properties/stockSync"]:visible').waitFor();
    const schemaTab = page.getByRole('tab', {
      name: demoEditorLabel(locale, 'Schema'),
      exact: true,
    });
    await schemaTab.click();
    const editor = page.locator('.monaco-editor:visible').last();
    const input = editor.locator('.inputarea, .native-edit-context');
    const revisedSchema = {
      type: 'object',
      properties: { jobName: { type: 'string', minLength: 50 } },
    };
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
      JSON.stringify(revisedSchema, null, 2),
    );
    await editor.locator('.view-lines').filter({ hasText: '"minLength": 50' }).waitFor();
    await page
      .getByRole('button', { name: labels[locale]['editor.schema.apply'], exact: true })
      .first()
      .click();
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const dataEditor = page.locator('.monaco-editor:visible').last();
    await expect.poll(() => dataEditor.locator('.squiggly-error').count()).toBeGreaterThan(0);

    await schemaTab.click();
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', '{"type":');
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await editor.locator('.view-lines').filter({ hasText: '"type":' }).waitFor();
    await page
      .getByRole('button', { name: labels[locale]['editor.schema.apply'], exact: true })
      .first()
      .click();
    await expect.poll(() => editor.locator('.view-lines').innerText()).toContain('"type":');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect.poll(() => dataEditor.locator('.squiggly-error').count()).toBeGreaterThan(0);

    await schemaTab.click();
    await page
      .getByRole('button', { name: labels[locale]['editor.schema.reload'], exact: true })
      .first()
      .click();
    await expect
      .poll(async () => (await editor.locator('.view-lines').innerText()).replaceAll('\u00a0', ' '))
      .toContain('Overnight replenishment job');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect.poll(() => dataEditor.locator('.squiggly-error').count()).toBeGreaterThan(0);

    await page.evaluate((webcomponent) => {
      location.hash = `#/examples/spec-string-controls?use-webcomponent=${webcomponent}&drawer=false`;
    }, webcomponent);
    await page.getByRole('heading', { name: 'Spec: String controls' }).waitFor();
    await page.evaluate((webcomponent) => {
      location.hash = `#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false&active-tab=schema`;
    }, webcomponent);
    await page.getByRole('heading', { name: 'Spec: Cron control' }).waitFor();
    const restoredEditor = page.locator('.monaco-editor:visible').last();
    await expect
      .poll(async () =>
        (await restoredEditor.locator('.view-lines').innerText()).replaceAll('\u00a0', ' '),
      )
      .toContain('Overnight replenishment job');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.locator('.monaco-editor:visible .view-lines').waitFor();
    await page.waitForTimeout(1000);
    expect(await page.locator('.monaco-editor:visible .squiggly-error').count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
