import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('config-initial-focus', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/config-initial-focus?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const input = page.locator('[id="#/properties/name-input"]');
  await expect.poll(() => input.inputValue()).toBe('Ada');
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
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  expect(errors).toEqual([]);
});
