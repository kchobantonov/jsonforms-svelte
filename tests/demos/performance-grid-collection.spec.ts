import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/translations.supplement.json';

const applicants = Array.from({ length: 300 }, (_, index) => ({
  name: `Candidate ${String(index).padStart(3, '0')}`,
  email: `candidate${index}@example.com`,
  experience: index % 20,
  contact: { city: 'Boston', phone: `555-${String(index).padStart(5, '0')}` },
  notes: 'Available for interview.',
}));

demoTest(
  'performance-grid-collection',
  async ({ page, family, locale, webcomponent, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Data', { applicants }, { verifyVisibleText: false });
    await page.getByRole('tab', { name: /^Demo/ }).click();
    const label = translations[locale]['specAgGrid.ui.elements.1.label'];
    await page.getByRole('tab', { name: label, exact: true }).click();
    const grid = page.getByRole('tabpanel', { name: label, exact: true }).locator('.ag-root');
    await expect
      .poll(() => page.locator(`jsonforms-svelte-${family}`).count())
      .toBe(webcomponent ? 1 : 0);
    const row = grid.locator('.ag-row[row-index="0"] [col-id="name"] input');
    await expect.poll(() => row.inputValue()).toBe('Candidate 000');
    const filterButton = grid.locator(
      '.ag-header-cell[col-id="name"] .ag-header-cell-filter-button',
    );
    const filter = page.locator('.ag-popup input.ag-text-field-input').first();
    const filterSamples: number[] = [];
    const editSamples: number[] = [];
    for (let iteration = 0; iteration < 6; iteration++) {
      const filterStart = await page.evaluate(() => performance.now());
      await filterButton.click();
      await filter.fill('Candidate 299');
      await filter.press('Escape');
      await expect
        .poll(() => row.inputValue())
        .toBe(iteration === 0 ? 'Candidate 299' : `Candidate 299 Updated ${iteration - 1}`);
      const filterElapsed = (await page.evaluate(() => performance.now())) - filterStart;
      const editStart = await page.evaluate(() => performance.now());
      const editedName = `Candidate 299 Updated ${iteration}`;
      await row.fill(editedName);
      await row.press('Tab');
      await expect.poll(() => row.inputValue()).toBe(editedName);
      const editElapsed = (await page.evaluate(() => performance.now())) - editStart;
      if (iteration > 0) {
        filterSamples.push(filterElapsed);
        editSamples.push(editElapsed);
      }
      await filterButton.click();
      await filter.fill('');
      await filter.press('Escape');
      await expect.poll(() => row.inputValue()).toBe('Candidate 000');
    }
    filterSamples.sort((a, b) => a - b);
    editSamples.sort((a, b) => a - b);
    expect(filterSamples[4]).toBeLessThan(2000);
    expect(editSamples[4]).toBeLessThan(3000);
    expect(errors).toEqual([]);
    console.log(
      `performance-grid-collection ${family} ${webcomponent ? 'webcomponent' : 'native'}: filter median/p95 ${filterSamples[2]!.toFixed(1)}/${filterSamples[4]!.toFixed(1)} ms, edit median/p95 ${editSamples[2]!.toFixed(1)}/${editSamples[4]!.toFixed(1)} ms for 300 rows`,
    );
  },
  { locales: ['en'], timeout: 30_000 },
);
