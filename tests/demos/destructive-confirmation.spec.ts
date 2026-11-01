import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/data.json';
import config from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/config.json';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('destructive-confirmation', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const remove = page
    .getByRole('tabpanel', {
      name: translations[locale]['featureNavigation.section1.label'],
      exact: true,
    })
    .locator('[data-additional-properties]')
    .first()
    .getByRole('button', {
      name: messages[locale]['additionalProperties.removeAriaLabel'],
      exact: true,
    })
    .first();
  await remove.click();
  const dialog = page.getByRole('dialog', {
    name: translations[locale]['confirm.delete.title'],
    exact: true,
  });
  await expect.poll(() => dialog.isVisible()).toBe(true);
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
    .click();
  await expect.poll(() => dialog.count()).toBe(0);
  await remove.click();
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
    .click();
  await expect.poll(() => remove.count()).toBe(0);
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section2.label'],
      exact: true,
    })
    .click();
  const grid = page.locator('.jsonforms-ag-grid');
  await expect.poll(() => grid.locator('.ag-row').count()).toBe(3);
  await grid.locator('.ag-row').first().getByRole('checkbox').check();
  await grid.locator('.jsonforms-ag-grid__actions').getByRole('button').first().click();
  await expect.poll(() => dialog.isVisible()).toBe(true);
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
    .click();
  await expect.poll(() => grid.locator('.ag-row').count()).toBe(2);
  expect(errors).toEqual([]);
});

demoTest(
  'destructive confirmation host replacement',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=true&drawer=false`,
    );
    const host = page.locator(`jsonforms-svelte-${family}`);
    const remove = page
      .getByRole('tabpanel', {
        name: translations[locale]['featureNavigation.section1.label'],
        exact: true,
      })
      .locator('[data-additional-properties]')
      .first()
      .getByRole('button', {
        name: messages[locale]['additionalProperties.removeAriaLabel'],
        exact: true,
      })
      .first();
    await remove.click();
    const dialog = page.getByRole('dialog', {
      name: translations[locale]['confirm.delete.title'],
      exact: true,
    });
    await expect.poll(() => dialog.isVisible()).toBe(true);
    const replacement = structuredClone(original);
    replacement.notes.gate = 'Host replacement';
    await host.evaluate(
      (element, data) => element.setAttribute('data', JSON.stringify(data)),
      replacement,
    );
    await expect.poll(() => dialog.count()).toBe(0);
    expect(JSON.parse((await host.getAttribute('data'))!)).toEqual(replacement);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'] },
);

demoTest(
  'destructive confirmation local override and live config',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['featureNavigation.section1.label'],
      exact: true,
    });
    const remove = (table: number) =>
      family === 'shadcn'
        ? panel
            .getByRole('button', {
              name: messages[locale]['collection.deleteSelected'],
              exact: true,
            })
            .nth(table)
        : panel
            .getByRole('table')
            .nth(table)
            .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true });
    const selectRow = async (table: number) => {
      if (family === 'shadcn') {
        await panel
          .getByRole('table')
          .nth(table)
          .getByRole('checkbox', {
            name: messages[locale]['collection.selectRow'].replace('{index}', '1'),
            exact: true,
          })
          .click();
      }
    };
    const tableValues = (table: number) =>
      panel
        .getByRole('table')
        .nth(table)
        .locator('input')
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
    await expect.poll(() => tableValues(0)).toContain('A-01');
    await expect.poll(() => tableValues(1)).toContain('TMP-1');
    const dialog = page.getByRole('dialog', {
      name: translations[locale]['confirm.delete.title'],
      exact: true,
    });
    await selectRow(0);
    await remove(0).click();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => tableValues(0)).toContain('A-01');
    await selectRow(1);
    await remove(1).click();
    await expect.poll(() => tableValues(1)).not.toContain('TMP-1');
    await expect.poll(() => dialog.count()).toBe(0);

    const nextConfig = structuredClone(config);
    nextConfig.jsonformsExtended.confirmation.default = 'never';
    await applyDemoEditor(page, locale, 'Config', nextConfig);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await remove(0).click();
    await expect.poll(() => tableValues(0)).not.toContain('A-01');
    await expect.poll(() => dialog.count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);
