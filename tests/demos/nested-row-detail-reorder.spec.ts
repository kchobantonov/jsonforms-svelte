import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import sourceUiSchema from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/uischema.json';
import sourceData from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/table-row-details/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'nested-row-detail-reorder',
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

    const uischema = structuredClone(sourceUiSchema);
    const enableReorder = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(enableReorder);
        return;
      }
      const element = node as Record<string, unknown>;
      if (element.type === 'ListWithDetail') {
        (element.options as Record<string, unknown>).showSortButtons = true;
        (element.options as Record<string, unknown>).elementLabelProp = 'company';
      }
      Object.values(element).forEach(enableReorder);
    };
    enableReorder(uischema);
    await applyDemoEditor(page, locale, 'UI Schema', uischema, { verifyVisibleText: false });
    const demoTab = page.getByRole('tab', {
      name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`),
    });
    await demoTab.click();
    await expect.poll(() => demoTab.getAttribute('aria-selected')).toBe('true');

    const agGridTab = page.getByRole('tab', {
      name: /^AG Grid: Dialog/,
    });
    await agGridTab.click();
    await page
      .getByRole('tabpanel', {
        name: /^AG Grid: Dialog/,
      })
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first()
      .click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('tab', {
        name: /^Experience/,
      })
      .click();
    await dialog.locator('[data-list-navigation] [data-list-avatar]').first().click();
    const company = dialog.getByRole('textbox', {
      name: translations[locale]['detailExample.company.label'],
      exact: true,
    });
    await expect.poll(() => company.inputValue()).toBe('Northwind');
    await dialog
      .getByRole('button', { name: messages[locale]['array.downAriaLabel'], exact: true })
      .first()
      .click();
    await expect.poll(() => company.inputValue()).toBe('Northwind');
    await company.fill('Northwind edited');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const expected = structuredClone(sourceData);
    expected.applicants[0].experience.reverse();
    expected.applicants[0].experience[1].company = 'Northwind edited';
    await expect
      .poll(async () => {
        await page
          .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
          .focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
