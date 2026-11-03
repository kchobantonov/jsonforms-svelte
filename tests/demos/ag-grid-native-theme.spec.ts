import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';

demoTest('ag-grid-native-theme', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page.getByRole('tab', { name: translations[locale]['gridTab.label'], exact: true }).click();
  const grid = page.locator('.jsonforms-ag-grid:visible').first();
  await grid.locator('.ag-root').waitFor();
  const root = await grid.locator('.ag-root').elementHandle();
  const setMode = async (mode: 'light' | 'dark') => {
    if (webcomponent) {
      await page.locator(`jsonforms-svelte-${family}`).evaluate((element, next) => {
        element.setAttribute('mode', next);
      }, mode);
    } else {
      await page.evaluate(
        ({ family, mode }) => {
          document.documentElement.setAttribute('data-mode', mode);
          document.documentElement.classList.toggle(
            'dark',
            mode === 'dark' && family === 'flowbite',
          );
        },
        { family, mode },
      );
    }
  };
  await setMode('light');
  const background = () => grid.evaluate((element) => getComputedStyle(element).backgroundColor);
  const light = await background();
  expect(light).not.toBe('rgba(0, 0, 0, 0)');
  await setMode('dark');
  await expect.poll(background).not.toBe(light);
  expect(await background()).not.toBe('rgba(0, 0, 0, 0)');
  expect(
    await grid.locator('.ag-root').evaluate((element, original) => element === original, root),
  ).toBe(true);
  await setMode('light');
  await expect.poll(background).toBe(light);
  expect(errors).toEqual([]);
});
