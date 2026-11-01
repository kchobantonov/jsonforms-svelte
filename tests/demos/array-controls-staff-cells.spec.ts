import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import initial from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-staff-cells',
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
    const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
    const row = panel.locator('tbody tr').first();
    const addressLabel =
      fields[locale]['specArrayControls.schema.properties.staff.items.properties.address.label'];
    const streetLabel =
      fields[locale][
        'specArrayControls.schema.properties.staff.items.properties.address.properties.street.label'
      ];
    const editAddress = row.getByRole('button', {
      name: messages[locale]['composite.edit'].replace('{label}', addressLabel),
      exact: true,
    });
    await expect.poll(() => row.textContent()).toContain('12 High Street');
    await editAddress.click();
    const dialog = page.getByRole('dialog');
    const street = dialog.getByRole('textbox', { name: streetLabel, exact: true });
    await expect.poll(() => street.inputValue()).toBe('12 High Street');
    await street.fill('Draft Street');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
      .click();
    await expect.poll(() => row.textContent()).toContain('12 High Street');

    await editAddress.click();
    await expect.poll(() => street.inputValue()).toBe('12 High Street');
    await street.fill('42 Shared Lane');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await expect.poll(() => row.textContent()).toContain('42 Shared Lane');

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
        ) as typeof initial;
        return data.staff;
      })
      .toEqual([
        { ...initial.staff[0], address: { ...initial.staff[0].address, street: '42 Shared Lane' } },
        initial.staff[1],
      ]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
