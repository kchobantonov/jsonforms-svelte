import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-staff-phone-clear',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
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
    const phoneCell = panel.locator('tbody tr').first().locator('[data-composite-cell]').last();
    const phoneLabel =
      fields[locale][
        'specArrayControls.schema.properties.staff.items.properties.phoneNumbers.label'
      ];
    const editPhones = phoneCell.getByRole('button', {
      name: messages[locale]['composite.edit'].replace('{label}', phoneLabel),
      exact: true,
    });
    const initialSummary = await phoneCell.locator('[data-composite-summary]').textContent();
    expect(initialSummary).toContain('+44 20 1234 5678');
    const clear = page.getByRole('button', {
      name: messages[locale]['composite.empty'],
      exact: true,
    });
    const confirm = page.getByRole('dialog', {
      name: messages[locale]['confirm.delete.title'],
      exact: true,
    });
    const acceptClear = async () => {
      await clear.click();
      await confirm
        .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
        .click();
      await expect.poll(() => confirm.count()).toBe(0);
    };

    await editPhones.click();
    await acceptClear();
    await page
      .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
      .click();
    await expect
      .poll(() => phoneCell.locator('[data-composite-summary]').textContent())
      .toBe(initialSummary);

    await editPhones.click();
    await expect.poll(() => clear.isVisible()).toBe(true);
    await acceptClear();
    await page
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await expect
      .poll(() => phoneCell.locator('[data-composite-summary]').textContent())
      .not.toBe(initialSummary);

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
      .toEqual([{ ...original.staff[0], phoneNumbers: [] }, original.staff[1]]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
