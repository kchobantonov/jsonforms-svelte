import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest('config-control-editing', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/config-control-editing?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const globalReadOnly = page.locator('input[id="#/properties/globalReadOnly-input"]');
  const localWritable = page.locator('input[id="#/properties/localWritable-input"]');
  const unrestricted = page.locator('input[id="#/properties/unrestricted-input"]');
  const aliasWritable = page.locator('input[id="#/properties/aliasWritable-input"]');
  await expect.poll(() => globalReadOnly.getAttribute('readonly')).not.toBeNull();
  expect(await globalReadOnly.getAttribute('disabled')).toBeNull();
  await globalReadOnly.focus();
  await globalReadOnly.press('9');
  expect(await globalReadOnly.inputValue()).toBe('Seed');

  for (const input of [localWritable, unrestricted, aliasWritable]) {
    expect(await input.getAttribute('readonly')).toBeNull();
    expect(await input.getAttribute('disabled')).toBeNull();
  }
  await localWritable.fill('12345');
  await localWritable.blur();
  await expect.poll(() => localWritable.inputValue()).toBe('1234');
  await unrestricted.fill('12345');
  await unrestricted.blur();
  await expect.poll(() => unrestricted.inputValue()).toBe('12345');

  const clearLabel = locale === 'bg' ? 'Изчистване на стойността' : 'Clear value';
  await localWritable.focus();
  await page.getByRole('button', { name: clearLabel, exact: true }).click();
  await expect.poll(() => localWritable.inputValue()).toBe('');
  expect(await unrestricted.inputValue()).toBe('12345');
  expect(errors).toEqual([]);
});
