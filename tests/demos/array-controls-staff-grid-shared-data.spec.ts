import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

demoTest(
  'array-controls-staff-grid-shared-data',
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
    const cell = (field: string) =>
      grid.locator(`.ag-row[row-index="0"] .ag-cell[col-id="${field}"]`);
    const gridName = cell('name').getByRole('textbox');
    await expect.poll(() => gridName.inputValue()).toBe('Ada Lovelace');
    await gridName.fill('Ada Byron');
    await gridName.blur();
    await expect
      .poll(() => panel.locator('tbody tr').first().getByRole('textbox').first().inputValue())
      .toBe('Ada Byron');
    await grid.evaluate(async (root) => {
      const viewport = [...root.querySelectorAll<HTMLElement>('[class*="viewport"]')].find(
        (element) => element.scrollWidth > element.clientWidth + 20,
      );
      if (!viewport) throw new Error('Expected a horizontally scrollable grid viewport');
      viewport.scrollLeft = viewport.scrollWidth;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const active = cell('active').getByRole('checkbox');
    await expect.poll(() => active.isChecked()).toBe(true);
    await active.click();
    await expect.poll(() => active.isChecked()).toBe(false);
    await expect
      .poll(() => panel.locator('tbody tr').first().getByRole('checkbox').last().isChecked())
      .toBe(false);

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
      .toEqual([{ ...original.staff[0], name: 'Ada Byron', active: false }, original.staff[1]]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
