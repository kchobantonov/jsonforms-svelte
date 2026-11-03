import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';

demoTest(
  'array-controls-staff-grid-pagination',
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
    const tableName = panel.locator('tbody tr').first().getByRole('textbox').first();
    await expect.poll(() => tableName.inputValue()).toBe('Ada Lovelace');
    await tableName.fill('Ada Byron');
    await tableName.blur();
    const grid = panel.locator('.ag-root');
    const rows = grid.locator('.ag-row[row-index]');
    const gridName = () => rows.first().locator('.ag-cell[col-id="name"] input');
    await expect.poll(() => rows.count()).toBe(1);
    await expect.poll(() => gridName().inputValue()).toBe('Ada Byron');
    const nextPage = panel.locator('.ag-paging-button[data-ref="btNext"]');
    const previousPage = panel.locator('.ag-paging-button[data-ref="btPrevious"]');
    await nextPage.click();
    await expect.poll(() => gridName().inputValue()).toBe('Grace Hopper');
    await previousPage.click();
    await expect.poll(() => gridName().inputValue()).toBe('Ada Byron');
    const pageSize = panel.locator('.ag-paging-page-size [role="combobox"]');
    await pageSize.click();
    const sizeOptions = panel.locator('.ag-select-list [role="option"]');
    await expect
      .poll(async () => (await sizeOptions.allTextContents()).map((text) => text.trim()))
      .toEqual(['1', '2', '10']);
    await sizeOptions.nth(1).click();
    await expect.poll(() => rows.count()).toBe(2);
    await expect
      .poll(() => rows.nth(0).locator('.ag-cell[col-id="name"] input').inputValue())
      .toBe('Ada Byron');
    await expect
      .poll(() => rows.nth(1).locator('.ag-cell[col-id="name"] input').inputValue())
      .toBe('Grace Hopper');

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page
          .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
          .focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        const data = JSON.parse(
          await page.evaluate(() => navigator.clipboard.readText()),
        ) as typeof original;
        return data.staff;
      })
      .toEqual([{ ...original.staff[0], name: 'Ada Byron' }, original.staff[1]]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
