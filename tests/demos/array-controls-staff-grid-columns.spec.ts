import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';

demoTest(
  'array-controls-staff-grid-columns',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const tabLabel = translations[locale]['cellsTab.label'];
    await page.getByRole('tab', { name: tabLabel, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
    const grid = panel.locator('.ag-root-wrapper');
    const header = (field: string) => grid.locator(`.ag-header-cell[col-id="${field}"]`);
    await expect.poll(() => header('name').count()).toBe(1);
    await expect
      .poll(async () => Math.round((await header('name').boundingBox())!.width))
      .toBe(170);
    await expect
      .poll(() => header('name').locator('.ag-header-cell-filter-button').count())
      .toBe(1);

    await grid.evaluate(async (root) => {
      const viewport = [...root.querySelectorAll<HTMLElement>('[class*="viewport"]')].find(
        (element) => element.scrollWidth > element.clientWidth + 20,
      );
      if (!viewport) throw new Error('Expected a horizontally scrollable grid viewport');
      viewport.scrollLeft = viewport.scrollWidth;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    for (const [field, width] of [
      ['active', 170],
      ['address', 240],
      ['phoneNumbers', 240],
    ] as const) {
      await expect.poll(() => header(field).count()).toBe(1);
      await expect
        .poll(async () => Math.round((await header(field).boundingBox())!.width))
        .toBe(width);
      await expect
        .poll(() => header(field).locator('.ag-header-cell-filter-button').count())
        .toBe(0);
    }
    await expect
      .poll(() => grid.locator('.ag-row[row-index="0"] .ag-cell[col-id="address"]').textContent())
      .toContain('12 High Street');
    await expect
      .poll(() =>
        grid.locator('.ag-row[row-index="0"] .ag-cell[col-id="phoneNumbers"]').textContent(),
      )
      .toContain('+44 20 1234 5678');
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
