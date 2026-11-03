import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-staff-grid-color',
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
    const grid = panel.locator('.ag-root-wrapper');
    const colorCell = grid.locator('.ag-row[row-index="0"] .ag-cell[col-id="badge"]');
    await expect.poll(() => colorCell.locator('[data-color-trigger]').count()).toBe(1);
    await colorCell.locator('[data-color-trigger]').click();
    const hex = page.getByRole('textbox', { name: messages[locale]['color.hex'], exact: true });
    await expect.poll(() => hex.isVisible()).toBe(true);
    if (webcomponent) {
      expect(await hex.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        true,
      );
    }
    await hex.fill('#643aed');

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
      .toEqual([{ ...original.staff[0], badge: '#643aed' }, original.staff[1]]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
