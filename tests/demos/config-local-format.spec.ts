import { expect } from 'vite-plus/test';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import { demoTest } from '../helpers/demo';

demoTest(
  'config-local-format',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/config-local-format?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const numeric = page.locator('input[id="#/properties/numeric-input"]');
    await expect.poll(() => numeric.getAttribute('type'), { timeout: 10_000 }).toBe('number');
    expect(await numeric.inputValue()).toBe('12');
    const password = page.locator('input[id="#/properties/password-input"]');
    expect(await password.getAttribute('type')).toBe('password');
    for (const [key, label] of [
      ['date', family === 'flowbite' ? 'temporal.openDate' : 'temporal.chooseDate'],
      ['time', family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
      ['dateTime', family === 'flowbite' ? 'temporal.openDateTime' : 'temporal.chooseDateTime'],
    ] as const) {
      await page.locator(`input[id="#/properties/${key}-input"]`).waitFor();
      await expect
        .poll(() =>
          page.getByRole('button', { name: messages[locale][label], exact: true }).count(),
        )
        .toBe(1);
    }
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);
