import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/translations.json';

demoTest(
  'category validation native and Web Component styles',
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
    await page.goto(
      `${base}/${family}/#/examples/spec-container-validation-indicator?drawer=false`,
    );
    const popupStyle = async (webcomponent: boolean) => {
      await page.goto(
        `${base}/${family}/#/examples/spec-container-validation-indicator?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page.reload();
      const category = page
        .getByRole('tab', { name: translations[locale]['personalDetails.label'], exact: false })
        .or(
          page.getByRole('button', {
            name: translations[locale]['personalDetails.label'],
            exact: false,
          }),
        )
        .first();
      const marker = category.locator('[data-container-validation-indicator]');
      await marker.scrollIntoViewIfNeeded();
      await marker.click();
      const summary = page.locator('[data-error-summary]:visible');
      const popup = summary.locator('xpath=ancestor::*[@role="dialog"][1]');
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
