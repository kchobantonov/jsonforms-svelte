import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import originalSchema from '@chobantonov/jsonforms-extended-spec/examples/array-controls/schema.json';
import tabs from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'config-collection-presentation',
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
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const replaceEditor = async (name: 'Schema' | 'Config' | 'Data', value: unknown) => {
      const label = demoEditorLabel(locale, name);
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
      await editor.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await editor.evaluate((element, content) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', content);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, JSON.stringify(value));
      await toolbar.getByRole('button').nth(1).click();
    };

    const data = structuredClone(original);
    data.speakers[0].name = 'x';
    data.sponsors[0].name = 'x';
    data.tickets[0].price = -1;
    await replaceEditor('Data', data);
    const schema = structuredClone(originalSchema);
    Object.assign(schema.properties.speakers, { minItems: data.speakers.length + 1 });
    Object.assign(schema.properties.sponsors, { minItems: data.sponsors.length + 1 });
    await replaceEditor('Schema', schema);
    await replaceEditor('Config', { hideAvatar: true, hideArraySummaryValidation: true });
    const firstIndex = `${messages[locale]['collection.index'].replace('{index}', '1')}:`;
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();

    await page.getByRole('tab', { name: tabs[locale]['expandableTab.label'], exact: true }).click();
    const expandable = page.getByRole('tabpanel', {
      name: tabs[locale]['expandableTab.label'],
      exact: true,
    });
    await expect.poll(() => expandable.locator('[data-row-summary]').count()).toBeGreaterThan(0);
    expect(await expandable.locator('[data-array-avatar]').count()).toBe(0);
    await expect.poll(() => expandable.locator('[data-array-summary]').count()).toBe(1);
    expect((await expandable.locator('[data-array-summary]').textContent())?.trim()).toBe('1');
    expect(
      await expandable.locator('.sr-only').filter({ hasText: firstIndex }).count(),
    ).toBeGreaterThan(0);

    await page.getByRole('tab', { name: tabs[locale]['listTab.label'], exact: true }).click();
    const list = page.getByRole('tabpanel', { name: tabs[locale]['listTab.label'], exact: true });
    await expect.poll(() => list.locator('[data-list-item-errors]').count()).toBeGreaterThan(0);
    expect(await list.locator('[data-list-avatar]').count()).toBe(0);
    await expect.poll(() => list.locator('[data-array-summary]').count()).toBe(1);
    expect((await list.locator('[data-array-summary]').textContent())?.trim()).toBe('1');
    expect(await list.locator('.sr-only').filter({ hasText: firstIndex }).count()).toBeGreaterThan(
      0,
    );
    if (family !== 'skeleton') {
      await page.getByRole('tab', { name: tabs[locale]['gridTab.label'], exact: true }).click();
      const gridPanel = page.getByRole('tabpanel', {
        name: tabs[locale]['gridTab.label'],
        exact: true,
      });
      const grid = gridPanel.locator('[data-jsonforms-ag-grid]');
      await expect.poll(() => grid.locator('.ag-row').count()).toBeGreaterThan(0);
      expect(await grid.locator('.jsonforms-ag-grid__validation').count()).toBe(0);
    }
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
