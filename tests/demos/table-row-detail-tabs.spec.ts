import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'table-row-detail-tabs',
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
    await page
      .locator('[data-array-summary]:visible')
      .first()
      .getByRole('button', { name: messages[locale]['collection.firstError'] })
      .click();
    const dialog = page.getByRole('dialog');
    await expect.poll(() => dialog.count()).toBe(1);
    const applicant = dialog.getByRole('tab', {
      name: new RegExp(`^${translations[locale]['rowDetails.applicant.label']}`),
    });
    const contact = dialog.getByRole('tab', {
      name: new RegExp(`^${translations[locale]['rowDetails.contact.label']}`),
    });
    const marker = applicant.locator(
      '[data-container-validation-indicator], [data-object-own-errors], [data-additional-property-errors]',
    );
    await expect.poll(() => marker.count()).toBe(1);
    await contact.click();
    await expect.poll(() => marker.count()).toBe(1);
    await applicant.click();
    await dialog
      .getByRole('textbox', {
        name: translations[locale]['detailExample.notes.label'],
        exact: true,
      })
      .fill('Available for interview');
    await expect.poll(() => marker.count()).toBe(0);
    await dialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await expect.poll(() => dialog.count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
