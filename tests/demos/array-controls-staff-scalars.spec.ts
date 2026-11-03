import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-staff-scalars',
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
    const row = panel.locator('tbody tr').first();
    const age = row.locator('input[type="number"]').first();
    const tenure = row.locator('input[list*="duration-completions"]');
    const active = row.getByRole('checkbox').last();
    await expect.poll(() => age.inputValue()).toBe('36');
    await expect.poll(() => tenure.inputValue()).toBe('P2Y6M');
    await expect.poll(() => active.isChecked()).toBe(true);
    await expect.poll(() => row.locator('[data-color-trigger]').count()).toBe(1);
    const selectedRole =
      fields[locale]['specArrayControls.schema.properties.staff.items.properties.role.Coordinator'];
    if (family === 'skeleton') {
      await expect.poll(() => row.getByRole('combobox').first().inputValue()).toBe(selectedRole);
    } else {
      await expect
        .poll(() => row.getByText(selectedRole, { exact: true }).count())
        .toBeGreaterThan(0);
    }
    for (const key of [
      family === 'flowbite' ? 'temporal.openDate' : 'temporal.chooseDate',
      family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime',
      family === 'flowbite' ? 'temporal.openDateTime' : 'temporal.chooseDateTime',
    ] as const) {
      await expect
        .poll(() => row.getByRole('button', { name: messages[locale][key], exact: true }).count())
        .toBe(1);
    }

    await age.fill('37');
    await age.blur();
    await tenure.fill('P3Y');
    await tenure.blur();
    await active.click();
    await expect.poll(() => active.isChecked()).toBe(false);

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
        { ...original.staff[0], age: 37, tenure: 'P3Y', active: false },
        original.staff[1],
      ]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
