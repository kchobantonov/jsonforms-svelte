import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import fields from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import sourceUi from '@chobantonov/jsonforms-extended-spec/examples/array-controls/uischema.json';

demoTest(
  'array-panel-collapse',
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
    const warnings: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto(
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Config'), exact: true }).click();
    const toolbar = page
      .getByRole('heading', { name: demoEditorLabel(locale, 'Config'), exact: true })
      .locator('..');
    const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await editor.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', '{"jsonformsExtended":{"array":{"collapsed":true}}}');
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await toolbar.getByRole('button').nth(1).click();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();

    const tableTab = page.getByRole('tab', {
      name: translations[locale]['tableTab.label'],
      exact: true,
    });
    await tableTab.click();
    const tablePanel = page.getByRole('tabpanel', {
      name: translations[locale]['tableTab.label'],
      exact: true,
    });
    const tableToggle = tablePanel.locator('[data-array-panel-toggle]');
    await expect.poll(() => tableToggle.getAttribute('aria-expanded')).toBe('false');
    await tableToggle.click();
    await expect.poll(() => tableToggle.getAttribute('aria-expanded')).toBe('true');
    await tablePanel.getByRole('table').waitFor({ state: 'visible' });

    await page
      .getByRole('tab', { name: translations[locale]['expandableTab.label'], exact: true })
      .click();
    const expandable = page.getByRole('tabpanel', {
      name: translations[locale]['expandableTab.label'],
      exact: true,
    });
    const toggles = expandable.locator('[data-array-panel-toggle]');
    await expect.poll(() => toggles.count()).toBe(2);
    await expect.poll(() => toggles.first().getAttribute('aria-expanded')).toBe('false');
    await toggles.first().click();
    await expect.poll(() => toggles.first().getAttribute('aria-expanded')).toBe('true');

    await page
      .getByRole('tab', { name: translations[locale]['listTab.label'], exact: true })
      .click();
    const listPanel = page.getByRole('tabpanel', {
      name: translations[locale]['listTab.label'],
      exact: true,
    });
    const listToggle = listPanel.locator('[data-array-panel-toggle]');
    await expect.poll(() => listToggle.getAttribute('aria-expanded')).toBe('false');
    await listToggle.click();
    await expect.poll(() => listToggle.getAttribute('aria-expanded')).toBe('true');
    await listPanel.locator('[role="option"], button[aria-current]').nth(1).click();
    const notes = listPanel.getByRole('textbox', {
      name: fields[locale][
        'specArrayControls.schema.properties.sponsors.items.properties.notes.label'
      ],
      exact: true,
    });
    await notes.fill('Retained through panel collapse');
    await notes.blur();
    const editorNode = await notes.elementHandle();
    await listToggle.click();
    await expect.poll(() => listToggle.getAttribute('aria-expanded')).toBe('false');
    await listToggle.click();
    await expect.poll(() => listToggle.getAttribute('aria-expanded')).toBe('true');
    await expect.poll(() => notes.inputValue()).toBe('Retained through panel collapse');
    expect(await notes.evaluate((node, prior) => node === prior, editorNode)).toBe(true);

    const gridTab = page.getByRole('tab', {
      name: translations[locale]['gridTab.label'],
      exact: true,
    });
    await gridTab.click();
    const gridPanel = page.getByRole('tabpanel', {
      name: translations[locale]['gridTab.label'],
      exact: true,
    });
    const gridToggle = gridPanel.locator('[data-array-panel-toggle]');
    await expect.poll(() => gridToggle.getAttribute('aria-expanded')).toBe('false');
    await gridToggle.click();
    await expect.poll(() => gridToggle.getAttribute('aria-expanded')).toBe('true');
    const grid = gridPanel.locator('.ag-root');
    const firstCode = grid.locator('.ag-row[row-index="0"] .ag-cell[col-id="code"] input');
    await expect.poll(() => firstCode.inputValue()).toBe('EARLY-1');
    await grid.locator('.ag-header-cell[col-id="code"] .ag-header-cell-text').click();
    await expect
      .poll(() => grid.locator('.ag-header-cell[col-id="code"]').getAttribute('aria-sort'))
      .toBe('ascending');
    const gridNode = await grid.elementHandle();
    await gridToggle.click();
    await expect.poll(() => grid.isVisible()).toBe(false);
    await gridToggle.click();
    await expect.poll(() => grid.isVisible()).toBe(true);
    expect(await grid.evaluate((node, prior) => node === prior, gridNode)).toBe(true);
    await expect
      .poll(() => grid.locator('.ag-header-cell[col-id="code"]').getAttribute('aria-sort'))
      .toBe('ascending');
    await expect.poll(() => firstCode.inputValue()).toBe('EARLY-1');

    const invalidUi = structuredClone(sourceUi);
    const expandableSection = invalidUi.elements[1];
    if (!expandableSection?.elements) throw new Error('Missing canonical expandable section');
    const arrayOptions = expandableSection.elements[0].elements[1].options;
    if (!arrayOptions) throw new Error('Missing canonical array options');
    Object.assign(arrayOptions, { collapsed: 'invalid' });
    await applyDemoEditor(page, locale, 'UI Schema', invalidUi, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await tableTab.click();
    await expect
      .poll(() => warnings.some((warning) => warning.includes('section.invalidCollapsed')))
      .toBe(true);
    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { array: { collapsed: false } },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await tableTab.click();
    await expect.poll(() => tableToggle.getAttribute('aria-expanded')).toBe('true');
    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { array: { collapsed: true } },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await tableTab.click();
    await expect.poll(() => tableToggle.getAttribute('aria-expanded')).toBe('false');
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
