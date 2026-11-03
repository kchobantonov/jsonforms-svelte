import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-password-control/translations.json';
import { defaultShadcnDesignSystem } from '../../packages/jsonforms-svelte-shadcn/src/lib/theme/design-system';

demoTest(
  'password tooltip native and Web Component styles',
  async ({ page, family, locale, base }) => {
    const url = (webcomponent: boolean) =>
      `${base}/${family}/#/examples/spec-password-control?use-webcomponent=${webcomponent}&drawer=false`;
    await page.addInitScript(
      ({ family, locale }) => {
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        );
      },
      { family, locale },
    );
    await page.goto(base);
    const style = async (webcomponent: boolean) => {
      await page.goto(url(webcomponent));
      const reveal = page
        .getByRole('button', { name: messages[locale]['password.show'], exact: true })
        .first();
      await reveal.hover();
      const tooltip = page.locator(
        family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible',
      );
      await tooltip.waitFor();
      return tooltip.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          root: element.getRootNode() instanceof ShadowRoot,
          background: computed.backgroundColor,
          foreground: computed.color,
          padding: computed.paddingTop,
        };
      });
    };
    let defaultLightBackground = '';
    for (const mode of ['light', 'dark'] as const) {
      await page.evaluate(
        ({ family, mode }) =>
          localStorage.setItem(
            `${family}-example-mode`,
            JSON.stringify({ version: 1, value: mode }),
          ),
        { family, mode },
      );
      const native = await style(false);
      const webcomponent = await style(true);
      expect(native.root).toBe(false);
      expect(webcomponent.root).toBe(true);
      expect(native.background).not.toBe('rgba(0, 0, 0, 0)');
      expect(Number.parseFloat(native.padding)).toBeGreaterThan(0);
      expect(webcomponent).toEqual({ ...native, root: true });
      if (mode === 'light') defaultLightBackground = native.background;
    }
    if (family === 'shadcn') {
      await page.evaluate(
        ({ family, designSystem }) => {
          localStorage.setItem(
            `${family}-example-mode`,
            JSON.stringify({ version: 1, value: 'light' }),
          );
          localStorage.setItem(
            `${family}-example-design-system`,
            JSON.stringify({ version: 1, value: designSystem }),
          );
        },
        {
          family,
          designSystem: { ...defaultShadcnDesignSystem, baseColor: 'zinc', theme: 'zinc' },
        },
      );
      const native = await style(false);
      const webcomponent = await style(true);
      expect(webcomponent).toEqual({ ...native, root: true });
      expect(native.background).not.toBe(defaultLightBackground);
    }
  },
  { hosts: ['native'], timeout: 60_000 },
);
