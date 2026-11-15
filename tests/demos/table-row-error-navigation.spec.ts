import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'table-row-error-navigation',
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
    await page
      .getByRole('tab', { name: new RegExp(`^${translations[locale]['rowDetails.dialog.label']}`) })
      .click();
    const summary = page.locator('[data-array-summary]:visible').first();
    await expect.poll(() => summary.count()).toBe(1);
    await summary.getByRole('button', { name: messages[locale]['collection.firstError'] }).click();
    const dialog = page.getByRole('dialog');
    await expect.poll(() => dialog.count()).toBe(1);
    const notes = dialog.getByRole('textbox', {
      name: translations[locale]['detailExample.notes.label'],
      exact: true,
    });
    await expect.poll(() => notes.inputValue()).toBe('');
    await expect.poll(() => notes.getAttribute('aria-invalid')).toBe('true');
    await notes.fill('Available for interview');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await expect.poll(() => dialog.count()).toBe(0);
    await expect.poll(() => summary.count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
