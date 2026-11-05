import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import demoMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'row-summary-search',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-table-row-details?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', { name: translations[locale]['rowDetails.ag_grid_dialog.label'] })
      .click();
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['rowDetails.ag_grid_dialog.label'],
    });
    const header = panel.locator('.ag-header-cell[col-id="applicantSummary"]');
    await expect.poll(() => header.count()).toBe(1);
    await header.locator('.ag-header-cell-filter-button').click();
    const filter = page.locator('.ag-popup input.ag-text-field-input').first();
    await filter.fill('applicant12@example.com');
    const displayedRows = panel.locator('.ag-row [col-id="applicantSummary"]');
    await expect.poll(() => displayedRows.count()).toBe(1);
    await expect
      .poll(() => displayedRows.first().textContent())
      .toContain(
        locale === 'bg'
          ? 'applicant12@example.com — Applicant 12'
          : 'Applicant 12 — applicant12@example.com',
      );
    await filter.press('Escape');
    await panel
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '12'),
        exact: true,
      })
      .click();
    const notes = page.getByRole('textbox', {
      name: translations[locale]['detailExample.notes.label'],
      exact: true,
    });
    await expect.poll(() => notes.inputValue()).toBe('Interview availability to confirm.');
    await notes.fill('Filtered row 12');
    await page
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await header.locator('.ag-header-cell-filter-button').click();
    await page.locator('.ag-popup input.ag-text-field-input').first().fill('');
    await expect.poll(() => displayedRows.count()).toBeGreaterThan(1);
    await page.locator('.ag-popup input.ag-text-field-input').first().press('Escape');
    await panel
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first()
      .click();
    await expect.poll(() => notes.inputValue()).toBe('Interview availability to confirm.');
    await page.getByRole('dialog').press('Escape');
    await header.locator('.ag-header-cell-filter-button').click();
    await page
      .locator('.ag-popup input.ag-text-field-input')
      .first()
      .fill('applicant12@example.com');
    await expect.poll(() => displayedRows.count()).toBe(1);
    await page.locator('.ag-popup input.ag-text-field-input').first().press('Escape');
    await panel
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '12'),
        exact: true,
      })
      .click();
    await expect.poll(() => notes.inputValue()).toBe('Filtered row 12');
    await page.getByRole('dialog').press('Escape');

    await header.locator('.ag-header-cell-filter-button').click();
    await page.locator('.ag-popup input.ag-text-field-input').first().fill('');
    await page.locator('.ag-popup input.ag-text-field-input').first().press('Escape');
    const contactHeader = panel.locator('.ag-header-cell[col-id="contact"]');
    const contactRows = panel.locator('.ag-row [col-id="contact"]');
    const firstVisibleContact = panel.locator('.ag-row[row-index="0"] [col-id="contact"]');
    await contactHeader.locator('.ag-header-cell-filter-button').click();
    const contactFilter = page.locator('.ag-popup input.ag-text-field-input').first();
    await contactFilter.fill('Boston');
    await expect.poll(() => contactRows.count()).toBe(4);
    await expect.poll(() => contactRows.first().textContent()).toContain('Boston · 555-01000');
    await contactFilter.fill('555-01010');
    await expect.poll(() => contactRows.count()).toBe(1);
    await expect.poll(() => contactRows.first().textContent()).toContain('Seattle · 555-01010');
    await contactFilter.fill('');
    await contactFilter.press('Escape');
    await contactHeader.locator('.ag-header-cell-text').click();
    await expect.poll(() => firstVisibleContact.textContent()).toContain('Austin · 555-01002');
    await contactHeader.locator('.ag-header-cell-text').click();
    await expect.poll(() => firstVisibleContact.textContent()).toContain('Seattle · 555-01010');
  },
  { timeout: 30_000 },
);

demoTest(
  'row-summary-search respects a disabled dynamic-values gate',
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
      `${base}/${family}/#/examples/spec-table-row-details?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { dynamicValues: { enabled: false } },
    });
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    await page
      .getByRole('tab', {
        name: translations[locale]['rowDetails.ag_grid_dialog.label'],
      })
      .click();
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['rowDetails.ag_grid_dialog.label'],
    });
    const summaryCells = panel.locator('.ag-row [col-id="applicantSummary"]');
    await expect.poll(() => summaryCells.count()).toBeGreaterThan(1);
    expect((await summaryCells.allTextContents()).join(' ')).not.toContain(
      'applicant01@example.com',
    );
    const header = panel.locator('.ag-header-cell[col-id="applicantSummary"]');
    await header.locator('.ag-header-cell-filter-button').click();
    await page
      .locator('.ag-popup input.ag-text-field-input')
      .first()
      .fill('applicant01@example.com');
    await expect.poll(() => summaryCells.count()).toBe(0);
    expect(errors).toEqual([]);
  },
);

demoTest(
  'row-summary-search updates on a locale-only change',
  async ({ page, family, webcomponent, base }) => {
    await page.addInitScript(
      (family) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: 'en' }),
        ),
      family,
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-table-row-details?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', { name: translations.en['rowDetails.ag_grid_dialog.label'] })
      .click();
    const panel = page.getByRole('tabpanel', {
      name: translations.en['rowDetails.ag_grid_dialog.label'],
    });
    const header = panel.locator('.ag-header-cell[col-id="applicantSummary"]');
    await expect.poll(() => header.count()).toBe(1);
    await header.locator('.ag-header-cell-filter-button').click();
    const filter = page.locator('.ag-popup input.ag-text-field-input').first();
    await filter.fill('Applicant 12 — applicant12@example.com');
    const rows = panel.locator('.ag-row [col-id="applicantSummary"]');
    await expect.poll(() => rows.count()).toBe(1);
    await filter.press('Escape');

    await page.getByRole('button', { name: demoMessages.en['nav.openSettings'] }).click();
    if (family === 'shadcn') {
      await page.locator('#locale').click();
      await page
        .getByRole('option', { name: demoMessages.en['settings.bulgarian'], exact: true })
        .click();
    } else {
      await page.locator('#locale').selectOption('bg');
    }
    await expect.poll(() => rows.count()).toBe(0);
    await page.getByRole('button', { name: demoMessages.bg['nav.closeSettings'] }).last().click();
    const translatedPanel = page.getByRole('tabpanel', {
      name: translations.bg['rowDetails.ag_grid_dialog.label'],
    });
    const translatedHeader = translatedPanel.locator('.ag-header-cell[col-id="applicantSummary"]');
    await translatedHeader.locator('.ag-header-cell-filter-button').click();
    const translatedFilter = page.locator('.ag-popup input.ag-text-field-input').first();
    await translatedFilter.fill('applicant12@example.com — Applicant 12');
    const translatedRows = translatedPanel.locator('.ag-row [col-id="applicantSummary"]');
    await expect.poll(() => translatedRows.count()).toBe(1);
    await expect
      .poll(() => translatedRows.first().textContent())
      .toContain('applicant12@example.com — Applicant 12');
  },
  { locales: ['en'], timeout: 45_000 },
);
