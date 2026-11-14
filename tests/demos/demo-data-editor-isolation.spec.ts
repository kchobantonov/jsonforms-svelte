import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import labels from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import original from '@chobantonov/jsonforms-extended-spec/examples/cron-control/data.json';

demoTest(
  'demo-data-editor-isolation',
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
      `${base}/${family}/#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const field = page.locator('input[id*="/properties/stockSync"]:visible');
    await field.waitFor();
    const dataTab = page.getByRole('tab', {
      name: demoEditorLabel(locale, 'Data'),
      exact: true,
    });
    await dataTab.click();
    const editor = page.locator('.monaco-editor:visible').last();
    await editor.locator('.view-lines').waitFor();
    const editorText = async () =>
      (await editor.locator('.view-lines').innerText()).replaceAll('\u00a0', ' ');
    const input = editor.locator('.inputarea, .native-edit-context');
    const draft = { ...original, jobName: 'Unapplied draft' };
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
      JSON.stringify(draft, null, 2),
    );
    await editor.locator('.view-lines').filter({ hasText: 'Unapplied draft' }).waitFor();

    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    await field.fill('0 0 9 * * *');
    await field.blur();
    await dataTab.click();
    await expect.poll(editorText).toContain('Unapplied draft');

    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', '{"jobName":');
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await editor.locator('.view-lines').filter({ hasText: '"jobName":' }).waitFor();
    await page
      .getByRole('button', { name: labels[locale]['editor.data.apply'], exact: true })
      .first()
      .click();
    await expect.poll(editorText).toContain('"jobName":');
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    expect(await field.inputValue()).toBe('0 0 9 * * *');
    await dataTab.click();

    await page
      .getByRole('button', { name: labels[locale]['editor.data.reload'], exact: true })
      .first()
      .click();
    await expect.poll(editorText).toContain('Overnight replenishment');
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    expect(await field.inputValue()).toBe('0 0 9 * * *');

    await dataTab.click();
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
      JSON.stringify({ ...original, jobName: 'Applied draft' }, null, 2),
    );
    await page
      .getByRole('button', { name: labels[locale]['editor.data.apply'], exact: true })
      .first()
      .click();
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    await expect.poll(() => field.inputValue()).toBe('0 0/15 * * * *');
    await field.fill('0 0 8 * * *');
    await field.blur();
    await dataTab.click();
    await expect.poll(editorText).toContain('Applied draft');
    await expect.poll(editorText).toContain('0 0 8 * * *');
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
