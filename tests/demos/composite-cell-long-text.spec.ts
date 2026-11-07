import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'long composite cell text stays within the table and editable detail',
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
    const cell = page.locator('tbody tr').first().locator('[data-composite-cell]').first();
    await expect.poll(() => cell.isVisible()).toBe(true);
    const edit = cell.getByRole('button').first();
    await edit.click();
    const dialog = page.getByRole('dialog');
    const street = dialog.getByRole('textbox').first();
    const longStreet = 'A long address that must remain available in the detail editor '.repeat(4);
    await street.fill(longStreet);
    await page
      .getByRole('button', {
        name: new RegExp(`^(${messages.en['composite.apply']}|${messages.bg['composite.apply']})$`),
      })
      .click();
    const summary = cell.locator('[data-composite-summary]');
    await expect.poll(() => summary.textContent()).toContain(longStreet);
    const geometry = await summary.evaluate((element) => {
      const cell = element.closest('[data-composite-cell]')!;
      const summaryBox = element.getBoundingClientRect();
      const cellBox = cell.getBoundingClientRect();
      return {
        summaryRight: summaryBox.right,
        cellRight: cellBox.right,
        hasLocalScroll: (() => {
          let ancestor = element.parentElement;
          while (ancestor) {
            if (
              ancestor.scrollWidth > ancestor.clientWidth + 1 &&
              /auto|scroll/.test(getComputedStyle(ancestor).overflowX)
            )
              return true;
            ancestor = ancestor.parentElement;
          }
          return false;
        })(),
      };
    });
    expect(geometry.summaryRight).toBeLessThanOrEqual(geometry.cellRight + 1);
    expect(geometry.hasLocalScroll).toBe(true);
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(390);
    await edit.click();
    await expect.poll(() => street.inputValue()).toBe(longStreet);
    const [dialogBox, fieldBox] = await Promise.all([dialog.boundingBox(), street.boundingBox()]);
    expect(dialogBox).not.toBeNull();
    expect(fieldBox).not.toBeNull();
    expect(dialogBox!.x).toBeGreaterThanOrEqual(-1);
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(391);
    expect(fieldBox!.x + fieldBox!.width).toBeLessThanOrEqual(dialogBox!.x + dialogBox!.width);
    expect(errors).toEqual([]);
  },
  { locales: ['bg'], timeout: 30_000 },
);
