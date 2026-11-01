import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const local of [false, true]) {
  demoTest(
    `config-split-${local ? 'local' : 'flat'}-resizable`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.addInitScript(
        ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
        { family, locale },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/${family}/#/examples/config-split-${local ? 'local' : 'flat'}-resizable?use-webcomponent=${webcomponent}&drawer=false`,
      );

      const separator = page.locator('[data-split-layout] [role="separator"]:visible');
      await expect
        .poll(() => separator.evaluate((element) => element.tabIndex))
        .toBe(local ? 0 : -1);
      expect(errors).toEqual([]);
    },
  );
}
