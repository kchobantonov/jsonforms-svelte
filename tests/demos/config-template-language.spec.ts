import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const kind of ['flat', 'namespaced', 'explicit'] as const) {
  demoTest(
    `config-template-language-${kind}`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.addInitScript(
        ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
        { family, locale },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/${family}/#/examples/config-template-language-${kind}?use-webcomponent=${webcomponent}&drawer=false`,
      );

      if (kind === 'namespaced') {
        await expect
          .poll(() =>
            page.locator('[role="alert"]:visible').filter({ hasText: 'unavailable' }).count(),
          )
          .toBeGreaterThan(0);
        expect(await page.locator('.template-language-ok').count()).toBe(0);
      } else {
        await expect.poll(() => page.locator('.template-language-ok:visible').count()).toBe(1);
      }
      expect(errors).toEqual([]);
    },
  );
}
