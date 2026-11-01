import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-staff-grid-composite',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
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
    await grid.evaluate(async (root) => {
      const viewport = [...root.querySelectorAll<HTMLElement>('[class*="viewport"]')].find(
        (element) => element.scrollWidth > element.clientWidth + 20,
      );
      if (!viewport) throw new Error('Expected a horizontally scrollable grid viewport');
      viewport.scrollLeft = viewport.scrollWidth;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const cell = (field: string) =>
      grid.locator(`.ag-row[row-index="0"] .ag-cell[col-id="${field}"]`);
    const address = cell('address');
    const addressLabel =
      fields[locale]['specArrayControls.schema.properties.staff.items.properties.address.label'];
    const streetLabel =
      fields[locale][
        'specArrayControls.schema.properties.staff.items.properties.address.properties.street.label'
      ];
    const editAddress = address.getByRole('button', {
      name: messages[locale]['composite.edit'].replace('{label}', addressLabel),
      exact: true,
    });
    await expect.poll(() => address.textContent()).toContain('12 High Street');
    await editAddress.click();
    const dialog = page.getByRole('dialog');
    const street = dialog.getByRole('textbox', { name: streetLabel, exact: true });
    await expect.poll(() => street.inputValue()).toBe('12 High Street');
    await street.fill('Draft Street');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
      .click();
    await expect.poll(() => address.textContent()).toContain('12 High Street');
    await editAddress.click();
    await expect.poll(() => street.inputValue()).toBe('12 High Street');
    await street.fill('42 Shared Lane');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await expect.poll(() => address.textContent()).toContain('42 Shared Lane');

    const phone = cell('phoneNumbers');
    const phoneLabel =
      fields[locale][
        'specArrayControls.schema.properties.staff.items.properties.phoneNumbers.label'
      ];
    const editPhone = phone.getByRole('button', {
      name: messages[locale]['composite.edit'].replace('{label}', phoneLabel),
      exact: true,
    });
    const initialPhoneSummary = await phone.locator('[data-composite-summary]').textContent();
    expect(initialPhoneSummary).toContain('+44 20 1234 5678');
    const clearPhones = async () => {
      await page
        .getByRole('button', { name: messages[locale]['composite.empty'], exact: true })
        .click();
      const confirmation = page.getByRole('dialog', {
        name: messages[locale]['confirm.delete.title'],
        exact: true,
      });
      await confirmation
        .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
        .click();
      await expect.poll(() => confirmation.count()).toBe(0);
    };
    await editPhone.click();
    await clearPhones();
    await page
      .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
      .click();
    await expect
      .poll(() => phone.locator('[data-composite-summary]').textContent())
      .toBe(initialPhoneSummary);
    await editPhone.click();
    await clearPhones();
    await page
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await expect
      .poll(() => phone.locator('[data-composite-summary]').textContent())
      .not.toBe(initialPhoneSummary);

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
      .toEqual([
        {
          ...original.staff[0],
          address: { ...original.staff[0].address, street: '42 Shared Lane' },
          phoneNumbers: [],
        },
        original.staff[1],
      ]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 25_000 },
);
