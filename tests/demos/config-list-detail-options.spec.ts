import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('config-list-detail-options', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/config-list-detail-options?use-webcomponent=${webcomponent}&drawer=false`,
  );

  await expect.poll(() => page.locator('[title="Alpha"]').count()).toBeGreaterThan(0);
  expect(await page.locator('[title="Ada"]').count()).toBe(0);
  await expect.poll(() => page.locator('[data-list-item-errors]').count()).toBeGreaterThan(0);
  expect(await page.locator('[data-array-summary]').count()).toBe(0);
  const addPrefix = messages[locale]['array.addAriaLabelWithLabel'].split('{label}')[0];
  const addStates = await page
    .locator('button[aria-label]')
    .evaluateAll(
      (buttons, prefix) =>
        buttons
          .filter((button) => button.getAttribute('aria-label')?.startsWith(prefix))
          .map((button) => (button as HTMLButtonElement).disabled),
      addPrefix,
    );
  expect(addStates).toEqual([true]);
  const remove = page.getByRole('button', {
    name: messages[locale]['array.removeAriaLabel'],
    exact: true,
  });
  await expect.poll(() => remove.count()).toBe(2);
  expect(await remove.first().isDisabled()).toBe(true);
  const down = page.getByRole('button', {
    name: messages[locale]['array.downAriaLabel'],
    exact: true,
  });
  await expect.poll(() => down.count()).toBe(2);
  await page.locator('[title="Alpha"]').first().click();
  await expect
    .poll(() => page.getByText('Configured detail', { exact: true }).count())
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
