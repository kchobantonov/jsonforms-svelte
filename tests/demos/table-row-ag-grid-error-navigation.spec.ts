import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'table-row-ag-grid-error-navigation',
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
    const url = `${base}/${family}/#/examples/spec-table-row-details?use-webcomponent=${webcomponent}&drawer=false`;
    for (const mode of ['ag_grid_dialog', 'ag_grid_side_panel'] as const) {
      await page.goto(url);
      await page
        .getByRole('tab', {
          name: new RegExp(`^${translations[locale][`rowDetails.${mode}.label`]}`),
        })
        .click();
      const panel = page.getByRole('tabpanel', {
        name: new RegExp(`^${translations[locale][`rowDetails.${mode}.label`]}`),
      });
      if (mode === 'ag_grid_side_panel') {
        const select = panel.locator('button[data-row-detail-selected]').first();
        await select.waitFor();
        const selectLabel = await select.getAttribute('aria-label');
        expect(selectLabel).toContain(
          messages[locale]['collection.editRowDetails'].split('{index}')[0],
        );
        await select.focus();
        const hint = page
          .locator(
            family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible',
          )
          .filter({ hasText: selectLabel ?? '' })
          .first();
        await expect.poll(() => hint.isVisible()).toBe(true);
        expect(await hint.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
          webcomponent,
        );
        expect(
          await hint.evaluate((element) => getComputedStyle(element).backgroundColor),
        ).not.toBe('rgba(0, 0, 0, 0)');
        await page.keyboard.press('Escape');
        await expect.poll(() => hint.isVisible()).toBe(false);
        await expect.poll(() => select.evaluate((element) => element.matches(':focus'))).toBe(true);
      }
      const summaryHeader = panel.locator('.ag-header-cell[col-id="applicantSummary"]');
      await summaryHeader.locator('.ag-header-cell-filter-button').click();
      const filter = page.locator('.ag-popup input.ag-text-field-input').first();
      await filter.fill('applicant1@example.com');
      await filter.press('Escape');
      const displayed = page.locator('.ag-row [col-id="applicantSummary"]:visible');
      await expect.poll(() => displayed.count()).toBe(1);
      const summary = panel.locator('[data-array-summary]:visible');
      await summary
        .getByRole('button', { name: messages[locale]['collection.firstError'] })
        .click();
      const surface =
        mode === 'ag_grid_dialog'
          ? page.getByRole('dialog')
          : panel.locator('[data-row-detail-panel]:visible');
      await expect.poll(() => surface.count()).toBe(1);
      const notes = surface.getByRole('textbox', {
        name: translations[locale]['detailExample.notes.label'],
        exact: true,
      });
      await expect.poll(() => notes.inputValue()).toBe('');
      await expect.poll(() => displayed.count()).toBe(1);
      if (mode === 'ag_grid_dialog') {
        await surface
          .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
          .click();
        await expect.poll(() => surface.count()).toBe(0);
        const jump = summary.getByRole('button', {
          name: messages[locale]['collection.firstError'],
        });
        await expect.poll(() => jump.evaluate((element) => element.matches(':focus'))).toBe(true);
        await jump.click();
        await expect.poll(() => surface.count()).toBe(1);
      }
      await notes.fill('Available for interview');
      if (mode === 'ag_grid_dialog') {
        await surface
          .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
          .click();
        await expect.poll(() => surface.count()).toBe(0);
      } else await notes.blur();
      await expect.poll(() => summary.count()).toBe(0);
      await expect.poll(() => displayed.count()).toBe(1);
    }
    expect(errors).toEqual([]);
  },
  { timeout: 60_000 },
);
