import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

demoTest(
  'webcomponent-registry-competition',
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
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );

    await page
      .getByRole('tab', { name: translations[locale]['cellsTab.label'], exact: true })
      .click();
    const row = page
      .getByRole('tabpanel', { name: translations[locale]['cellsTab.label'], exact: true })
      .locator('tbody tr')
      .first();
    await row.waitFor();
    expect(await row.getByRole('textbox').first().inputValue()).toBe('Ada Lovelace');
    expect(await row.locator('[data-color-trigger]').count()).toBe(1);
    expect(await row.locator('input[list*="duration-completions"]').inputValue()).toBe('P2Y6M');
    expect(await row.locator('[data-composite-cell]').count()).toBeGreaterThanOrEqual(2);
    if (webcomponent) {
      const host = page.locator(`jsonforms-svelte-${family}`);
      const staffName = row.getByRole('textbox').first();
      await staffName.fill('Ada Byron');
      await expect
        .poll(() =>
          host.evaluate((element) => {
            const value = (
              element as HTMLElement & { data: string | { staff?: { name?: string }[] } }
            ).data;
            const data = typeof value === 'string' ? JSON.parse(value) : value;
            return data.staff?.[0]?.name;
          }),
        )
        .toBe('Ada Byron');
      await host.evaluate((element) => {
        const parent = element.parentNode!;
        const next = element.nextSibling;
        element.remove();
        parent.insertBefore(element, next);
      });
      await page
        .getByRole('tab', { name: translations[locale]['cellsTab.label'], exact: true })
        .click();
      await expect.poll(() => staffName.inputValue()).toBe('Ada Byron');
      expect(await row.locator('[data-color-trigger]').count()).toBe(1);
      expect(await row.locator('input[list*="duration-completions"]').inputValue()).toBe('P2Y6M');
      expect(await row.locator('[data-composite-cell]').count()).toBeGreaterThanOrEqual(2);
      await staffName.fill('Ada Lovelace');
      await expect
        .poll(() =>
          host.evaluate((element) => {
            const value = (
              element as HTMLElement & { data: string | { staff?: { name?: string }[] } }
            ).data;
            const data = typeof value === 'string' ? JSON.parse(value) : value;
            return data.staff?.[0]?.name;
          }),
        )
        .toBe('Ada Lovelace');
    }
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
