import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import catalog from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-combinators/supplemental-translations.json';

demoTest(
  'OneOf selector native and Web Component styles',
  async ({ page, family, locale, base }) => {
    const url = (webcomponent: boolean) =>
      `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`;
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(url(false));
    const style = async (webcomponent: boolean) => {
      await page.goto(url(webcomponent));
      await page.reload();
      const trigger =
        family === 'shadcn'
          ? page.locator('button[id*="/properties/contact"][aria-haspopup="listbox"]:visible')
          : page
              .locator('input[id*="/properties/contact"]:visible')
              .locator('..')
              .locator('button[aria-haspopup="listbox"]');
      await trigger.click();
      const option = page.getByRole('option', {
        name: catalog[locale]['Phone contact'],
        exact: true,
      });
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
