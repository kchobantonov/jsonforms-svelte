import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

const message =
  'These files were not added. A maximum of 3 attachments is allowed; existing files were kept.';

demoTest(
  'file feedback native and Web Component styles',
  async ({ page, family, base }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript((family) => {
      localStorage.setItem(`${family}-example-locale`, JSON.stringify({ version: 1, value: 'en' }));
    }, family);
    await page.goto(`${base}/${family}/#/examples/spec-file-control?drawer=false`);
    const popupStyle = async (webcomponent: boolean) => {
      await page.goto(
        `${base}/${family}/#/examples/spec-file-control?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page.reload();
      await page.getByRole('tab', { name: 'Table cells', exact: true }).click();
      await page.getByRole('tab', { name: 'AG Grid', exact: true }).click();
      const input = page.locator('.ag-root:visible input[type="file"][multiple]').first();
      const cell = input.locator('xpath=ancestor::*[@data-file-control][1]');
      await input.setInputFiles({
        name: 'third.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('third'),
      });
      await cell.getByText('third.txt', { exact: true }).waitFor();
      await input.setInputFiles({
        name: 'excess.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('excess'),
      });
      const trigger = cell.getByRole('button', { name: message, exact: true });
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await trigger.evaluate((element) => (element as HTMLButtonElement).click());
      const popup = page
        .locator(
          '[role="dialog"]:visible, [role="tooltip"]:visible, [data-slot="popover-content"]:visible, [data-scope="popover"][data-part="content"]:visible',
        )
        .filter({ hasText: message })
        .last();
      await popup.waitFor();
      return popup.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          root: element.getRootNode() instanceof ShadowRoot,
          background: computed.backgroundColor,
          foreground: computed.color,
          radius: computed.borderRadius,
        };
      });
    };
    for (const mode of ['light', 'dark'] as const) {
      await page.evaluate(
        ({ family, mode }) =>
          localStorage.setItem(
            `${family}-example-mode`,
            JSON.stringify({ version: 1, value: mode }),
          ),
        { family, mode },
      );
      const native = await popupStyle(false);
      const webcomponent = await popupStyle(true);
      expect(native.root).toBe(false);
      expect(native.background).not.toBe('rgba(0, 0, 0, 0)');
      expect(webcomponent).toEqual({ ...native, root: true });
    }
  },
  { locales: ['en'], hosts: ['native'], timeout: 60_000 },
);
