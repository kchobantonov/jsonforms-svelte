import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/numeric-controls/translations.json';

demoTest(
  'slider tooltip native and Web Component styles',
  async ({ page, family, locale, base }) => {
    const url = (webcomponent: boolean) =>
      `${base}/${family}/#/examples/spec-numeric-controls?use-webcomponent=${webcomponent}&drawer=false`;
    await page.goto(url(false));
    const style = async (webcomponent: boolean) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(url(webcomponent));
      await page.reload();
      await page
        .getByRole('tab', {
          name: translations[locale]['featureNavigation.section3.label'],
          exact: true,
        })
        .click();
      await page.setViewportSize({ width: 390, height: 900 });
      const slider = page.getByRole('slider', {
        name: supplement[locale]['specNumericControls.schema.properties.discountPercent.label'],
        exact: true,
      });
      await slider.focus();
      const tooltip =
        family === 'flowbite'
          ? page.locator('[role="tooltip"]:visible').first()
          : page.locator('[data-slot="slider-value-tooltip"]:visible').first();
      await tooltip.waitFor();
      return tooltip.evaluate((element) => {
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
        ({ family, locale, mode }) => {
          localStorage.setItem(
            `${family}-example-locale`,
            JSON.stringify({ version: 1, value: locale }),
          );
          localStorage.setItem(
            `${family}-example-mode`,
            JSON.stringify({ version: 1, value: mode }),
          );
        },
        { family, locale, mode },
      );
      const native = await style(false);
      const webcomponent = await style(true);
      expect(native.root).toBe(false);
      expect(webcomponent).toEqual({ ...native, root: true });
    }
  },
  { hosts: ['native'], timeout: 60_000 },
);
