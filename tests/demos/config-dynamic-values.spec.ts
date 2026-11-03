import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const enabled of [false, true]) {
  demoTest(
    `config-dynamic-values-${enabled ? 'enabled' : 'disabled'}`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.addInitScript(
        ({ family, locale }) =>
          localStorage.setItem(
            `${family}-example-locale`,
            JSON.stringify({ version: 1, value: locale }),
          ),
        { family, locale },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/${family}/#/examples/config-dynamic-values-${enabled ? 'enabled' : 'disabled'}?use-webcomponent=${webcomponent}&drawer=false`,
      );

      if (enabled) {
        await expect
          .poll(() => page.getByText('Hello Ada', { exact: true }).isVisible())
          .toBe(true);
        expect(await page.locator('[data-markup-diagnostic]').count()).toBe(0);
      } else {
        await expect
          .poll(() => page.locator('[data-markup-diagnostic]').count())
          .toBeGreaterThan(0);
        expect(await page.getByText('Hello Ada', { exact: true }).count()).toBe(0);
      }
      expect(errors).toEqual([]);
    },
  );
}
