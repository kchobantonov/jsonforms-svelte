import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/translations.json';

demoTest(
  'mixed type selector native and Web Component styles',
  async ({ page, family, locale, base }) => {
    const url = (webcomponent: boolean) =>
      `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`;
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(url(false));
    const style = async (webcomponent: boolean) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(url(webcomponent));
      await page.reload();
      await page
        .getByRole('tab', {
          name: translations[locale]['featureNavigation.section2.label'],
          exact: true,
        })
        .click();
      const field = page.locator('[id="#/properties/priority"]');
      const trigger =
        family === 'shadcn'
          ? field.locator('[data-slot="select-trigger"]')
          : field.locator('[data-part="trigger"]').first();
      await page.setViewportSize({ width: 390, height: 900 });
      await trigger.click();
      const option = page.getByRole('option', { name: 'string', exact: true });
      const popup = option.locator('xpath=ancestor::*[@role="listbox"][1]');
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
  { families: ['shadcn', 'skeleton'], hosts: ['native'], timeout: 60_000 },
);
