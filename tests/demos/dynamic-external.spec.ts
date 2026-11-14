import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'dynamic external editor shares settings and preserves invalid drafts',
  async ({ page, family, base }) => {
    await page.goto(`${base}/${family}/#/examples/spec-dynamic-playground?drawer=false`);
    const settings = page.getByTestId('dynamic-playground-configuration');
    await expect.poll(() => settings.isVisible()).toBe(true);
    await settings.getByRole('textbox', { name: 'Preview label', exact: true }).fill('First');
    await page.getByRole('tab', { name: 'External', exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const editor = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    const read = async () => {
      await editor.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return page.evaluate(() => navigator.clipboard.readText());
    };
    const write = async (text: string) => {
      await editor.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await editor.evaluate((element, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, text);
    };
    await expect.poll(async () => JSON.parse(await read()).settings.label).toBe('First');
    const external = JSON.parse(await read());
    external.settings.label = 'Second';
    external.host = { keep: 'namespace' };
    await write(JSON.stringify(external));
    await page.getByRole('tab', { name: 'Demo', exact: true }).click();
    await expect
      .poll(() =>
        settings.getByRole('textbox', { name: 'Preview label', exact: true }).inputValue(),
      )
      .toBe('Second');
    await expect
      .poll(() => page.getByRole('textbox', { name: 'Name', exact: true }).inputValue())
      .toBe('Ada');
    await settings.getByRole('checkbox', { name: 'Preview readonly', exact: true }).check();
    await page.getByRole('tab', { name: 'External', exact: true }).click();
    const roundtrip = JSON.parse(await read());
    expect(roundtrip.host).toEqual({ keep: 'namespace' });
    expect(roundtrip.settings.readonly).toBe(true);
    await write('{');
    await expect.poll(() => page.getByRole('alert').count()).toBeGreaterThan(0);
    await page.getByRole('tab', { name: 'Demo', exact: true }).click();
    await expect
      .poll(() =>
        settings.getByRole('textbox', { name: 'Preview label', exact: true }).inputValue(),
      )
      .toBe('Second');
    await page.getByRole('tab', { name: 'External', exact: true }).click();
    await expect.poll(() => read()).toBe('{');
  },
  { locales: ['en'], hosts: ['native'], timeout: 45_000 },
);
