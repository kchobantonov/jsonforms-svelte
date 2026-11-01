import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const local of [false, true]) {
  demoTest(
    `config-grid-options-${local ? 'local' : 'flat'}`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.addInitScript(
        ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
        { family, locale },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/${family}/#/examples/config-grid-options-${local ? 'local' : 'flat'}?use-webcomponent=${webcomponent}&drawer=false`,
      );

      await expect.poll(() => page.locator('.ag-root:visible').count()).toBe(1);
      await expect.poll(() => page.locator('.ag-paging-panel:visible').count()).toBe(local ? 1 : 0);
      expect(errors).toEqual([]);
    },
  );
}
