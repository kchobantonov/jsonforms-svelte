import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

demoTest(
  'AG Grid filter native and Web Component styles',
  async ({ page, family, locale, base }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${base}/${family}/#/examples/spec-array-controls?drawer=false`);
    await page.evaluate(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );

    const popupStyle = async (webcomponent: boolean) => {
      await page.goto(
        `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page
        .getByRole('tab', { name: translations[locale]['gridTab.label'], exact: true })
        .click();
      const filterButton = page.locator(
        '.ag-header-cell[col-id="code"] .ag-header-cell-filter-button',
      );
      await filterButton.scrollIntoViewIfNeeded();
      await filterButton.click();
      const popup = page.locator('.ag-popup .ag-menu:visible').first();
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
