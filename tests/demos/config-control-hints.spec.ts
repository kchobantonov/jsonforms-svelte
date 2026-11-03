import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest('config-control-hints', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/config-control-hints?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const inherited = page.locator('input[id="#/properties/inherited-input"]');
  const local = page.locator('input[id="#/properties/local-input"]');
  await expect.poll(() => inherited.getAttribute('placeholder')).toBe('Global hint');
  await expect.poll(() => local.getAttribute('placeholder')).toBe('');
  expect(await inherited.inputValue()).toBe('Initial inherited');
  expect(await local.inputValue()).toBe('Initial local');
  expect(await inherited.getAttribute('required')).not.toBeNull();
  expect(await local.getAttribute('required')).not.toBeNull();

  const inheritedLabel = page.locator('label[for="#/properties/inherited-input"]');
  const localLabel = page.locator('label[for="#/properties/local-input"]');
  expect(await inheritedLabel.locator('span[aria-hidden="true"]').count()).toBe(0);
  expect(await localLabel.locator('span[aria-hidden="true"]').count()).toBe(1);
  await expect
    .poll(() => page.getByText('Inherited description', { exact: true }).isVisible())
    .toBe(true);
  await expect
    .poll(() => page.getByText('Local description', { exact: true }).isVisible())
    .toBe(false);

  await local.focus();
  await expect
    .poll(() => page.getByText('Local description', { exact: true }).isVisible())
    .toBe(true);
  await local.blur();
  await expect
    .poll(() => page.getByText('Local description', { exact: true }).isVisible())
    .toBe(false);
  expect(errors).toEqual([]);
});
