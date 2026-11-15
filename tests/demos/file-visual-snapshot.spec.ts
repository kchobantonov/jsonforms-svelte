import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'file-visual-snapshot',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const url = `${base}/${family}/#/examples/spec-file-control?use-webcomponent=false&drawer=false`;
    const directory = path.resolve('test-results/file-visual-review');
    await mkdir(directory, { recursive: true });
    await page.goto(url);
    for (const mode of ['light', 'dark'] as const) {
      await page.evaluate(
        ({ family, mode }) =>
          localStorage.setItem(
            `${family}-example-mode`,
            JSON.stringify({ version: 1, value: mode }),
          ),
        { family, mode },
      );
      await page.reload();
      if (family === 'flowbite') {
        await expect
          .poll(() =>
            page.locator('html').evaluate((element) => element.classList.contains('dark')),
          )
          .toBe(mode === 'dark');
      } else {
        await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe(mode);
      }
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        const first = page.locator('[data-file-control]:visible').first();
        await first.waitFor();
        await first.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(directory, `${family}-${locale}-${mode}-${width}-form.png`),
        });
        await page
          .getByRole('tab', {
            name: locale === 'bg' ? 'Клетки в таблица' : 'Table cells',
            exact: true,
          })
          .click();
        const cell = page.locator('[data-file-control]:visible').first();
        await cell.waitFor();
        await cell.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(directory, `${family}-${locale}-${mode}-${width}-cell.png`),
        });
        await page.getByRole('tab', { name: 'AG Grid', exact: true }).click();
        await page.locator('.ag-root:visible').waitFor();
        await page
          .locator('.ag-root-wrapper:visible .ag-body-horizontal-scroll-viewport')
          .evaluate(async (element) => {
            element.scrollLeft = element.scrollWidth;
            await new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            );
          });
        const gridCell = page.locator('.ag-root:visible [data-file-control]').last();
        await gridCell.waitFor();
        await gridCell.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(directory, `${family}-${locale}-${mode}-${width}-grid.png`),
        });
        await page
          .getByRole('tab', {
            name: locale === 'bg' ? 'Няколко файла' : 'Multiple files',
            exact: true,
          })
          .click();
      }
    }
  },
  { hosts: ['native'], timeout: 90_000 },
);
