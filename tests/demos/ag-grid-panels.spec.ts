import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import initialData from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/data.json';
import uiSchema from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/uischema.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/schema.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'ag-grid-panels',
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
    const label = (index: number) => uiSchema.elements[index].label;
    const notesLabel = schema.properties.applicants.items.properties.notes.title;
    await page.getByRole('tab', { name: label(2), exact: true }).click();
    const side = page.getByRole('tabpanel', { name: label(2), exact: true });
    await side.locator('.ag-row[row-index="0"]').click({ position: { x: 100, y: 12 } });
    const notes = side.getByRole('textbox', { name: notesLabel, exact: true });
    await expect.poll(() => notes.inputValue()).toBe('Available next week.');
    await notes.fill('Side panel edit');
    await notes.blur();
    await side.locator('.ag-row[row-index="0"] .ag-selection-checkbox input').check();
    await expect.poll(() => notes.inputValue()).toBe('Side panel edit');
    await side.locator('.ag-row[row-index="1"]').click({ position: { x: 100, y: 12 } });
    await expect.poll(() => notes.inputValue()).toBe('Prefers afternoon interviews.');

    await page.getByRole('tab', { name: label(3), exact: true }).click();
    const bottom = page.getByRole('tabpanel', { name: label(3), exact: true });
    await bottom
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first()
      .click();
    const bottomNotes = bottom.getByRole('textbox', { name: notesLabel, exact: true });
    await expect.poll(() => bottomNotes.inputValue()).toBe('Side panel edit');
    await bottomNotes.fill('Bottom panel edit');
    await bottomNotes.blur();

    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const editor = page
      .getByRole('heading', { name: dataLabel, exact: true })
      .locator('..')
      .locator('..')
      .locator('.monaco-editor');
    await editor.click({ position: { x: 80, y: 20 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const expected = structuredClone(initialData);
    expected.applicants[0].notes = 'Bottom panel edit';
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
