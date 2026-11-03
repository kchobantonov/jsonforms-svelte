import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import labels from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'shadcn-normal-table-parity',
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
      `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const panel = page.getByRole('tabpanel', {
      name: labels[locale]['specAgGrid.ui.elements.0.label'],
      exact: true,
    });
    const table = panel.getByRole('table', {
      name: labels[locale]['specAgGrid.schema.properties.applicants.label'],
    });
    const rowCheckboxes = table.locator('tbody [data-row-selection] [role=checkbox]');
    const pageCheckbox = table.getByRole('checkbox', {
      name: messages[locale]['collection.selectPage'],
    });
    const bulkDelete = panel.getByRole('button', {
      name: messages[locale]['collection.deleteSelected'],
    });
    await expect.poll(() => rowCheckboxes.count()).toBe(3);
    expect(await bulkDelete.isDisabled()).toBe(true);
    await expect
      .poll(() =>
        rowCheckboxes.first().evaluate((node) => {
          const token = document.createElement('span');
          token.style.borderColor = 'hsl(var(--input))';
          node.append(token);
          const matches =
            getComputedStyle(node).borderColor === getComputedStyle(token).borderColor;
          token.remove();
          return matches;
        }),
      )
      .toBe(true);

    const contactActions = table
      .locator('tbody tr')
      .first()
      .locator('td')
      .nth(4)
      .locator('.composite-actions');
    await expect.poll(() => contactActions.count()).toBe(1);
    expect(await contactActions.evaluate((node) => getComputedStyle(node).opacity)).toBe('0');
    await table.locator('tbody tr').first().locator('td').nth(4).hover();
    expect(await contactActions.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');

    const resize = table.getByRole('separator', {
      name: messages[locale]['collection.resizeColumn'].replace(
        '{field}',
        labels[locale]['specAgGrid.schema.properties.applicants.items.properties.name.label'],
      ),
      exact: true,
    });
    expect(await resize.evaluate((node) => getComputedStyle(node, '::after').width)).toBe('1px');
    await resize.hover();
    expect(await resize.evaluate((node) => getComputedStyle(node, '::after').width)).toBe('2px');
    const beforeWidth = await resize.getAttribute('aria-valuenow');
    await resize.focus();
    await resize.press('ArrowRight');
    await expect.poll(() => resize.getAttribute('aria-valuenow')).not.toBe(beforeWidth);
    await contactActions.getByRole('button').first().focus();
    expect(await contactActions.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
    const rowBorder = await table
      .locator('tbody tr')
      .first()
      .evaluate((node) => getComputedStyle(node).borderBottomWidth);
    expect(rowBorder).toBe('1px');

    await rowCheckboxes.first().click();
    expect(await pageCheckbox.getAttribute('aria-checked')).toBe('mixed');
    await pageCheckbox.click();
    expect(await pageCheckbox.getAttribute('aria-checked')).toBe('true');
    await panel.getByRole('button', { name: messages[locale]['collection.next'] }).click();
    expect(await pageCheckbox.getAttribute('aria-checked')).toBe('false');
    await pageCheckbox.click();
    await bulkDelete.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog
      .getByRole('button', { name: messages[locale]['confirm.decline'], exact: true })
      .click();
    expect(await bulkDelete.isDisabled()).toBe(false);
    await bulkDelete.click();
    await dialog
      .getByRole('button', { name: messages[locale]['collection.deleteSelected'], exact: true })
      .click();
    const secondPage = messages[locale]['collection.page']
      .replace('{current}', '2')
      .replace('{pages}', '2');
    await expect.poll(() => panel.getByText(secondPage, { exact: true }).count()).toBe(1);
    expect(await bulkDelete.isDisabled()).toBe(true);
    expect(errors).toEqual([]);
  },
  { families: ['shadcn'] },
);

demoTest(
  'shadcn-normal-table-select-page-delete',
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
      `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const panel = page.getByRole('tabpanel', {
      name: labels[locale]['specAgGrid.ui.elements.0.label'],
      exact: true,
    });
    const table = panel.getByRole('table', {
      name: labels[locale]['specAgGrid.schema.properties.applicants.label'],
    });
    await expect.poll(() => table.locator('tbody tr').count()).toBe(3);
    const selectPage = table.getByRole('checkbox', {
      name: messages[locale]['collection.selectPage'],
    });
    for (let currentPage = 0; currentPage < 4; currentPage++) {
      await selectPage.click();
      if (currentPage < 3)
        await panel.getByRole('button', { name: messages[locale]['collection.next'] }).click();
    }
    await panel
      .getByRole('button', { name: messages[locale]['collection.deleteSelected'] })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog
      .getByRole('button', { name: messages[locale]['collection.deleteSelected'], exact: true })
      .click();
    await expect.poll(() => table.locator('tbody [data-row-selection]').count()).toBe(0);
  },
  { families: ['shadcn'] },
);

demoTest(
  'shadcn-normal-table-delete-last-page',
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
      `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const panel = page.getByRole('tabpanel', {
      name: labels[locale]['specAgGrid.ui.elements.0.label'],
      exact: true,
    });
    const table = panel.getByRole('table', {
      name: labels[locale]['specAgGrid.schema.properties.applicants.label'],
    });
    const next = panel.getByRole('button', { name: messages[locale]['collection.next'] });
    for (let index = 0; index < 3; index++) await next.click();
    await expect.poll(() => table.locator('tbody [data-row-selection]').count()).toBe(3);
    const firstName = table.locator('tbody tr').first().locator('td').nth(1).locator('input');
    await expect
      .poll(() => firstName.evaluate((node) => (node as HTMLInputElement).value))
      .toBe('Jordan Reed');
    await table.getByRole('checkbox', { name: messages[locale]['collection.selectPage'] }).click();
    await panel
      .getByRole('button', { name: messages[locale]['collection.deleteSelected'] })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog
      .getByRole('button', { name: messages[locale]['collection.deleteSelected'], exact: true })
      .click();
    await expect.poll(() => table.locator('tbody [data-row-selection]').count()).toBe(3);
    await expect
      .poll(() => firstName.evaluate((node) => (node as HTMLInputElement).value))
      .not.toBe('Jordan Reed');
  },
  { families: ['shadcn'] },
);
