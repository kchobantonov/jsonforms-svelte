import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'basic select native and Web Component styles',
  async ({ page, family, locale, base }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/selection-renderers?drawer=false`);
    const popupStyles = async (webcomponent: boolean) => {
      await page.goto('about:blank');
      await page.goto(
        `${base}/${family}/#/examples/selection-renderers?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const styles = [];
      for (const [field, option] of [
        ['color', 'Green'],
        ['plan', 'Professional plan'],
      ] as const) {
        const input = page.locator(`[id$="/properties/${field}-input"]:visible`);
        await input.scrollIntoViewIfNeeded();
        await input.click();
        const popup = page
          .getByRole('option', { name: option, exact: true })
          .locator('xpath=ancestor::*[@role="listbox"][1]');
        await popup.waitFor();
        styles.push(
          await popup.evaluate((element) => {
            const computed = getComputedStyle(element);
            return {
              root: element.getRootNode() instanceof ShadowRoot,
              background: computed.backgroundColor,
              foreground: computed.color,
              radius: computed.borderRadius,
            };
          }),
        );
        await page.keyboard.press('Escape');
      }
      return styles;
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
      const native = await popupStyles(false);
      const webcomponent = await popupStyles(true);
      expect(native).toHaveLength(2);
      for (let index = 0; index < native.length; index++) {
        expect(native[index].root).toBe(false);
        expect(native[index].background).not.toBe('rgba(0, 0, 0, 0)');
        expect(webcomponent[index]).toEqual({ ...native[index], root: true });
      }
    }
  },
  { families: ['shadcn', 'skeleton'], hosts: ['native'], timeout: 60_000 },
);
