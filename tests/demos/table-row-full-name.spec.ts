import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import initialData from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'table-row-full-name',
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
    for (const mode of ['dialog', 'ag_grid_dialog'] as const) {
      await page.goto(url);
      await page
        .getByRole('tab', {
          name: new RegExp(`^${translations[locale][`rowDetails.${mode}.label`]}`),
        })
        .click();
      const panel = page.getByRole('tabpanel', {
        name: new RegExp(`^${translations[locale][`rowDetails.${mode}.label`]}`),
      });
      const fullNameCell =
        mode === 'dialog'
          ? panel.getByText('Applicant 01', { exact: true }).first().locator('xpath=ancestor::td')
          : panel.locator('.ag-row[row-index="0"] [col-id="fullName"]');
      await fullNameCell.getByRole('button').click();
      const dialog = page.getByRole('dialog');
      const first = dialog.getByRole('textbox', {
        name: translations[locale]['detailExample.firstName.label'],
        exact: true,
      });
      const last = dialog.getByRole('textbox', {
        name: translations[locale]['detailExample.lastName.label'],
        exact: true,
      });
      await expect.poll(() => first.inputValue()).toBe('Applicant');
      await expect.poll(() => last.inputValue()).toBe('01');
      await first.fill('Edited');
      await last.fill('Name');
      await dialog
        .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
        .click();
      await expect.poll(() => dialog.count()).toBe(0);
      if (webcomponent) {
        const host = page.locator(`jsonforms-svelte-${family}`);
        await expect
          .poll(() =>
            host.evaluate((element) => {
              const value = (
                element as HTMLElement & { data: string | { applicants: { firstName: string }[] } }
              ).data;
              return (typeof value === 'string' ? JSON.parse(value) : value).applicants[0]
                .firstName;
            }),
          )
          .toBe('Edited');
      }
      await expect
        .poll(() => panel.getByText('Edited Name', { exact: true }).count())
        .toBeGreaterThan(0);
      await expect
        .poll(() =>
          panel
            .getByText(
              locale === 'bg'
                ? 'applicant1@example.com — Applicant 01'
                : 'Applicant 01 — applicant1@example.com',
              { exact: true },
            )
            .count(),
        )
        .toBeGreaterThan(0);

      const dataLabel = demoEditorLabel(locale, 'Data');
      await page.getByRole('tab', { name: dataLabel, exact: true }).click();
      const editor = page
        .getByRole('heading', { name: dataLabel, exact: true })
        .locator('..')
        .locator('..')
        .locator('.monaco-editor');
      await editor.click({ position: { x: 80, y: 20 } });
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      const expected = structuredClone(initialData);
      expected.applicants[0].firstName = 'Edited';
      expected.applicants[0].lastName = 'Name';
      await expect
        .poll(async () => {
          await page.keyboard.press('ControlOrMeta+A');
          await page.keyboard.press('ControlOrMeta+C');
          return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
        })
        .toEqual(expected);
    }
    expect(errors).toEqual([]);
  },
  { timeout: 60_000 },
);
