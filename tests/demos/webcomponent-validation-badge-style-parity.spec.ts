import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'validation badge native and Web Component styles',
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
    await page.goto(`${base}/${family}/#/examples/spec-additional-properties?drawer=false`);
    const popupStyle = async (webcomponent: boolean) => {
      await page.goto(
        `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const invalidName = page.locator('.property-name-invalid').filter({ hasText: 'sensor-x' });
      const trigger = invalidName
        .locator('[data-property-name-error]')
        .getByRole('button', { name: messages[locale]['validation.errors'] });
      await trigger.scrollIntoViewIfNeeded();
      if (family === 'shadcn') await trigger.hover();
      else await trigger.click();
      const summary = page.locator('[data-error-summary]:visible');
      const popup = summary.locator(
        'xpath=ancestor::*[@role="dialog" or @data-slot="popover-content"][1]',
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
