import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest('config-numeric-step', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/config-numeric-step?use-webcomponent=${webcomponent}&drawer=false`,
  );
  for (const [label, step] of [
    ['Decimal schema step', '0.25'],
    ['Decimal local step', '3'],
    ['Integer schema step', '2'],
    ['Integer local step', '3'],
  ]) {
    const input = page.getByRole('spinbutton', { name: label, exact: true });
    await expect.poll(() => input.getAttribute('step')).toBe(step);
  }
  expect(errors).toEqual([]);
});
