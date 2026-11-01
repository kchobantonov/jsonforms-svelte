import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const radio of [false, true]) {
  demoTest(
    `config-${radio ? 'radio' : 'choice'}-focus`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.addInitScript(
        ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
        { family, locale },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/${family}/#/examples/config-${radio ? 'radio' : 'choice'}-focus?use-webcomponent=${webcomponent}&drawer=false`,
      );

      const selector = radio
        ? family === 'flowbite'
          ? 'input[type="radio"]'
          : '[id="#/properties/choice-input"]'
        : '[id="#/properties/choice-input"]';
      const input = page.locator(selector).first();
      await expect
        .poll(() =>
          input.evaluate((element) => {
            const root = element.getRootNode();
            return root instanceof ShadowRoot
              ? root.activeElement === element
              : document.activeElement === element;
          }),
        )
        .toBe(true);
      expect(errors).toEqual([]);
    },
  );
}

demoTest('config-slider-focus', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/config-slider-focus?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const thumb = page.locator('input[type="range"], [role="slider"]').first();
  await expect
    .poll(() =>
      thumb.evaluate((element) => {
        const root = element.getRootNode();
        return root instanceof ShadowRoot
          ? root.activeElement === element
          : document.activeElement === element;
      }),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

demoTest('config-monaco-focus', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/config-monaco-focus?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const editor = page.locator('.jsonforms-monaco-editor:visible');
  const input = editor.locator('.inputarea, .native-edit-context');
  await expect
    .poll(() =>
      input.evaluate((element) => {
        const root = element.getRootNode();
        return root instanceof ShadowRoot
          ? root.activeElement === element
          : document.activeElement === element;
      }),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

for (const kind of ['color', 'cron', 'duration', 'file', 'null'] as const) {
  demoTest(`config-${kind}-focus`, async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/config-${kind}-focus?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const input = page.locator('[id="#/properties/value-input"]');
    await expect
      .poll(() =>
        input.evaluate((element) => {
          const root = element.getRootNode();
          return root instanceof ShadowRoot
            ? root.activeElement === element
            : document.activeElement === element;
        }),
      )
      .toBe(true);
    expect(errors).toEqual([]);
  });
}
