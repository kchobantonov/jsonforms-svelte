import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import fields from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

demoTest(
  'array-controls-staff-grid-role-duration',
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
    const grid = page
      .getByRole('tabpanel', { name: tabLabel, exact: true })
      .locator('.ag-root-wrapper');
    const cell = (field: string) =>
      grid.locator(`.ag-row[row-index="0"] .ag-cell[col-id="${field}"]`);
    const roleCell = cell('role');
    const technician =
      fields[locale]['specArrayControls.schema.properties.staff.items.properties.role.Technician'];
    if (family !== 'shadcn') {
      await roleCell.getByRole('combobox').selectOption({ label: technician });
    } else {
      await roleCell.locator('[data-slot="select-trigger"]').click();
      await page.getByRole('option', { name: technician, exact: true }).click();
    }
    const tenure = cell('tenure').locator('input[list*="duration-completions"]');
    await expect.poll(() => tenure.inputValue()).toBe('P2Y6M');
    await tenure.fill('P3Y');
    await tenure.blur();

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
      .toEqual([{ ...original.staff[0], role: 'Technician', tenure: 'P3Y' }, original.staff[1]]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
