import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'color picker native and Web Component styles',
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
    await page.goto(`${base}/${family}/#/examples/spec-color-control?drawer=false`);
    const popupStyle = async (webcomponent: boolean) => {
      await page.goto('about:blank');
      await page.goto(
        `${base}/${family}/#/examples/spec-color-control?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page
        .getByRole('tab', {
          name: locale === 'bg' ? 'Настройки на избора' : 'Picker options',
          exact: true,
        })
        .click();
      const trigger = page.locator('[id="#/properties/statusDot-picker"]');
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const slider = page.getByRole('slider', {
        name: locale === 'bg' ? 'Наситеност и яркост' : 'Saturation and brightness',
        exact: true,
      });
      const popup = slider.locator(
        'xpath=ancestor::*[@role="dialog" or @role="tooltip" or @data-slot="popover-content" or (@data-scope="popover" and @data-part="content")][1]',
      );
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
  { hosts: ['native'], timeout: 60_000 },
);
