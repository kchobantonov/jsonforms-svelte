import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const local of [false, true]) {
  demoTest(
    `config-monaco-${local ? 'local' : 'flat'}-dimensions`,
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
        `${base}/${family}/#/examples/config-monaco-${local ? 'local' : 'flat'}-dimensions?use-webcomponent=${webcomponent}&drawer=false`,
      );

      const editor = page.locator('.jsonforms-monaco-editor:visible');
      await expect
        .poll(() => editor.boundingBox().then((box) => box?.width))
        .toBe(local ? 240 : 360);
      await expect
        .poll(() => editor.boundingBox().then((box) => box?.height))
        .toBe(local ? 192 : 180);
      expect(errors).toEqual([]);
    },
  );
}
