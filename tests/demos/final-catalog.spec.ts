import { demoEditorLabel } from '../helpers/demo-labels';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import gridMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/translations.supplement.json';
import jobMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-kitchen-sink/translations.json';

demoTest('final-catalog', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const labels = gridMessages[locale];
  await page
    .getByRole('tab', { name: labels['specAgGrid.ui.elements.1.label'], exact: true })
    .click();
  await page.locator('.ag-root:visible').waitFor();
  const rows = page.locator('.ag-root:visible [role=row][row-index]');
  await expect.poll(() => rows.count()).toBe(3);
  await page
    .getByRole('tab', { name: labels['specAgGrid.ui.elements.5.label'], exact: true })
    .click();
  await expect.poll(() => rows.count()).toBe(2);
  await page
    .locator('.ag-header-group-cell-label:visible')
    .filter({
      hasText:
        labels['specAgGrid.ui.elements.5.elements.1.options.agGridOptions.columnDefs.0.headerName'],
    })
    .waitFor();
  await page
    .getByRole('tab', { name: labels['specAgGrid.ui.elements.6.label'], exact: true })
    .click();
  await expect.poll(() => rows.count()).toBe(12);
  await page.goto(
    `${base}/${family}/#/examples/spec-kitchen-sink?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const name = page.getByRole('textbox', {
    name: jobMessages[locale]['firstName.label'],
    exact: true,
  });
  await name.fill('Updated applicant');
  await name.blur();
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page
    .locator('.monaco-editor:visible .view-lines')
    .filter({ hasText: 'Updated applicant' })
    .waitFor();
  expect(errors).toEqual([]);
});
