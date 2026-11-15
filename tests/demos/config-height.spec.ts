import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const kind of ['grid', 'split'] as const) {
  for (const local of [false, true]) {
    demoTest(
      `config-${kind}-${local ? 'local' : 'flat'}-height`,
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
          `${base}/${family}/#/examples/config-${kind}-${local ? 'local' : 'flat'}-height?use-webcomponent=${webcomponent}&drawer=false`,
        );

        const surface = page.locator(
          kind === 'grid' ? '.jsonforms-ag-grid__body:visible' : '[data-split-layout]:visible',
        );
        await expect
          .poll(() => surface.boundingBox().then((box) => box?.height))
          .toBe(local ? 220 : 300);
        expect(errors).toEqual([]);
      },
    );
  }
}
