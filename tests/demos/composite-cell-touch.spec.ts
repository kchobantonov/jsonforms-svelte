import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'composite cell actions remain visible and operable on touch',
  async ({ page, base, family, locale, webcomponent }) => {
    await page.setViewportSize({ width: 390, height: 850 });
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
      `${base}/${family}/#/examples/table-cells?use-webcomponent=${webcomponent}&drawer=false`,
    );
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
    const cell = page.locator('tbody tr').first().locator('[data-composite-cell]').first();
    await expect.poll(() => cell.isVisible()).toBe(true);
    const edit = cell.getByRole('button').first();
    const remove = cell.locator('.composite-clear');
    await expect.poll(() => remove.count()).toBe(1);
    for (const action of [edit, remove]) {
      expect(await action.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
      expect(await action.isVisible()).toBe(true);
    }
    await edit.tap();
    const dialog = page.getByRole('dialog');
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => dialog.count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { hasTouch: true, timeout: 30_000 },
);
