import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import initialData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'ag-grid-detail-independence',
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
    await page
      .getByRole('tab', {
        name: translations[locale]['specAgGrid.ui.elements.1.label'],
        exact: true,
      })
      .click();
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['specAgGrid.ui.elements.1.label'],
      exact: true,
    });
    const contactCell = panel.locator('.ag-row[row-index="0"] [col-id="contact"]');
    await expect.poll(() => contactCell.textContent()).toContain('Boston');
    await contactCell.getByRole('button').first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    expect(await dialog.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await dialog.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    expect(
      await dialog.evaluate((element) =>
        element.contains((element.getRootNode() as Document | ShadowRoot).activeElement),
      ),
    ).toBe(true);
    const city = dialog.getByRole('textbox', {
      name: translations[locale]['applicants.contact.city.label'],
      exact: true,
    });
    const phone = dialog.getByRole('textbox', {
      name: translations[locale]['applicants.contact.phone.label'],
      exact: true,
    });
    await expect.poll(() => city.inputValue()).toBe('Boston');
    await expect.poll(() => phone.inputValue()).toBe('555-01000');
    await city.fill('Portland');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await expect.poll(() => contactCell.textContent()).toContain('Portland');
    await panel
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first()
      .click();
    const notes = dialog.getByRole('textbox', {
      name: translations[locale][
        'specAgGrid.schema.properties.applicants.items.properties.notes.label'
      ],
      exact: true,
    });
    await expect.poll(() => notes.inputValue()).toBe('Available next week.');
    await notes.fill('Ready tomorrow');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
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
    expected.applicants[0].contact.city = 'Portland';
    expected.applicants[0].notes = 'Ready tomorrow';
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
