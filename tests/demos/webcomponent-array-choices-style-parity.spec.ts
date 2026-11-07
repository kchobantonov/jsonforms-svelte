import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'array choices native and Web Component styles',
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
    await page.goto(`${base}/${family}/#/examples/spec-array-choices?drawer=false`);
    const popupStyle = async (webcomponent: boolean) => {
      await page.goto('about:blank');
      await page.goto(
        `${base}/${family}/#/examples/spec-array-choices?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const trigger = page.locator('[id*="/properties/alerts-input"]:visible');
      await trigger.scrollIntoViewIfNeeded();
      if (family === 'shadcn') await trigger.locator('svg').last().click();
      else await trigger.click();
      const option = page.getByRole('option', { name: 'SMS', exact: true });
      const popup =
        family === 'shadcn'
          ? page.locator('[data-slot="popover-content"][data-state="open"]')
          : option.locator('xpath=ancestor::*[@role="listbox"][1]');
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
  { families: ['shadcn', 'skeleton'], hosts: ['native'], timeout: 60_000 },
);
