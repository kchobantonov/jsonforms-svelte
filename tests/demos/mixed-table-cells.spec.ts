import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/translations.json';
import original from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/data.json';

demoTest('mixed-table-cells', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', { name: translations[locale]['mixedCells.navigation.label'], exact: true })
    .click();
  const table = page.getByRole('table').first();
  await expect.poll(() => table.locator('tbody tr').count()).toBe(8);
  await expect.poll(() => table.innerText()).not.toMatch(/No applicable (cell|renderer)/);

  const row = table.locator('tbody tr').first();
  await row.locator('[data-composite-cell]').hover({ position: { x: 5, y: 5 } });
  const edit = row.locator('[data-composite-cell] button').first();
  await expect.poll(() => edit.count()).toBe(1);
  await edit.click();
  const dialog = page.getByRole('dialog').first();
  await expect.poll(() => dialog.count()).toBe(1);
  await expect
    .poll(() =>
      dialog
        .locator('input')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value)),
    )
    .toContain('Portland');
  await expect.poll(() => dialog.innerText()).not.toMatch(/No applicable (cell|renderer)/);
  await expect
    .poll(() =>
      dialog
        .locator('label')
        .filter({ hasText: translations[locale]['mixedCells.value.label'] })
        .count(),
    )
    .toBe(0);
  await page.keyboard.press('Escape');
  await expect.poll(() => dialog.count()).toBe(0);

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const dataEditor = page.locator('.monaco-editor:visible');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await dataEditor.locator('.inputarea, .native-edit-context').focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    })
    .toEqual(original);
  expect(errors).toEqual([]);
});

demoTest('mixed-table-number-intent', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', { name: translations[locale]['mixedCells.navigation.label'], exact: true })
    .click();
  const row = page.getByRole('table').first().locator('tbody tr').nth(1);
  await row.locator('[data-composite-cell]').hover({ position: { x: 5, y: 5 } });
  await row.locator('[data-composite-cell] button').first().click();
  const dialog = page.getByRole('dialog').first();
  await expect
    .poll(() =>
      dialog
        .locator('input')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value)),
    )
    .toContain('2');
  if (family === 'flowbite') {
    await dialog.locator('select').first().selectOption({ label: 'number' });
  } else {
    await (
      family === 'shadcn'
        ? dialog.locator('[data-slot="select-trigger"]').first()
        : dialog.locator('[data-part="trigger"]').first()
    ).click();
    if (family === 'skeleton') {
      const contentId = await dialog
        .locator('[role="combobox"]')
        .first()
        .getAttribute('aria-controls');
      await page.locator(`[id="${contentId}"] [data-part="item"][data-value="2"]`).click();
    } else {
      await page.getByRole('option', { name: 'number', exact: true }).click();
    }
  }
  const numeric = dialog.locator('input[type="number"]').first();
  await expect.poll(() => numeric.inputValue()).toBe('2');
  await numeric.fill('2.5');
  await dialog
    .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
    .click();
  await expect.poll(() => dialog.count()).toBe(0);

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const dataEditor = page.locator('.monaco-editor:visible');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await dataEditor.locator('.inputarea, .native-edit-context').focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    })
    .toEqual({
      ...original,
      mixedRows: original.mixedRows.map((row, index) =>
        index === 1 ? { ...row, value: 2.5 } : row,
      ),
    });
  expect(errors).toEqual([]);
});

demoTest('mixed-table-missing-value', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', { name: translations[locale]['mixedCells.navigation.label'], exact: true })
    .click();
  const row = page.getByRole('table').first().locator('tbody tr').nth(7);
  await expect.poll(() => row.count()).toBe(1);
  await expect.poll(() => row.locator('.cell-invalid').count()).toBe(1);
  await row.locator('[data-composite-cell]').hover({ position: { x: 5, y: 5 } });
  await row.locator('[data-composite-cell] button').first().click();
  const dialog = page.getByRole('dialog').first();
  await expect.poll(() => dialog.count()).toBe(1);
  await expect
    .poll(() => dialog.locator('input[type="text"]:not([role="combobox"])').count())
    .toBe(0);
  if (family === 'flowbite') {
    await dialog.locator('select').first().selectOption({ label: 'string' });
  } else {
    await (
      family === 'shadcn'
        ? dialog.locator('[data-slot="select-trigger"]').first()
        : dialog.locator('[data-part="trigger"]').first()
    ).click();
    if (family === 'skeleton') {
      const contentId = await dialog
        .locator('[role="combobox"]')
        .first()
        .getAttribute('aria-controls');
      await page.locator(`[id="${contentId}"] [data-part="item"][data-value="0"]`).click();
    } else {
      await page.getByRole('option', { name: 'string', exact: true }).click();
    }
  }
  const input = dialog.locator('input[type="text"]:not([role="combobox"])').first();
  await expect.poll(() => input.count()).toBe(1);
  await input.fill('New value');
  await dialog
    .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
    .click();
  await expect.poll(() => dialog.count()).toBe(0);
  await expect.poll(() => row.locator('.cell-invalid').count()).toBe(0);

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const dataEditor = page.locator('.monaco-editor:visible');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await dataEditor.locator('.inputarea, .native-edit-context').focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    })
    .toEqual({
      ...original,
      mixedRows: original.mixedRows.map((row, index) =>
        index === 7 ? { ...row, value: 'New value' } : row,
      ),
    });
  expect(errors).toEqual([]);
});

for (const structured of ['object', 'array'] as const) {
  demoTest(
    `mixed-table-${structured}-detail`,
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
        `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page
        .getByRole('tab', {
          name: translations[locale]['mixedCells.navigation.label'],
          exact: true,
        })
        .click();
      const row = page
        .getByRole('table')
        .first()
        .locator('tbody tr')
        .nth(structured === 'object' ? 5 : 6);
      await row.locator('[data-composite-cell]').hover({ position: { x: 5, y: 5 } });
      await row.locator('[data-composite-cell] button').first().click();
      const dialog = page.getByRole('dialog').first();
      await expect.poll(() => dialog.count()).toBe(1);
      await dialog.locator('button[aria-expanded="false"]:visible').last().click();
      await dialog
        .getByRole('button', { name: messages[locale]['mixed.showPrimitives'], exact: true })
        .click();
      const root = dialog.getByRole('treeitem').first();
      if (family === 'flowbite') {
        await root
          .locator(
            '[role="button"][aria-label^="Expand "], [role="button"][aria-label^="Разгъване на "]',
          )
          .click();
      } else if (family === 'skeleton') {
        await root.locator('[data-part="branch-control"]').click();
      } else {
        await root.locator('button[aria-expanded="false"]').click();
      }
      const childLabel =
        structured === 'object' ? 'city' : messages[locale]['mixed.item'].replace('{index}', '0');
      await dialog.getByRole('treeitem').filter({ hasText: childLabel }).last().click();
      const child = dialog.getByRole('textbox', { name: childLabel, exact: true });
      await expect.poll(() => child.inputValue()).toBe('Portland');
      await child.fill('Salem');
      await dialog
        .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
        .click();
      await expect.poll(() => dialog.count()).toBe(0);

      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const dataEditor = page.locator('.monaco-editor:visible');
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await expect
        .poll(async () => {
          await dataEditor.locator('.inputarea, .native-edit-context').focus();
          await page.keyboard.press('ControlOrMeta+A');
          await page.keyboard.press('ControlOrMeta+C');
          return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
        })
        .toEqual({
          ...original,
          mixedRows: original.mixedRows.map((entry, index) =>
            index === (structured === 'object' ? 5 : 6)
              ? {
                  ...entry,
                  value:
                    structured === 'object'
                      ? {
                          ...(original.mixedRows[5].value as { city: string; active: boolean }),
                          city: 'Salem',
                        }
                      : ['Salem', 2, false],
                }
              : entry,
          ),
        });
      expect(errors).toEqual([]);
    },
  );
}

demoTest('mixed-table-null-vs-missing', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', { name: translations[locale]['mixedCells.navigation.label'], exact: true })
    .click();
  const table = page.getByRole('table').first();
  for (const [index, expected] of [
    [4, 'null'],
    [7, ''],
  ] as const) {
    const row = table.locator('tbody tr').nth(index);
    await row.locator('[data-composite-cell]').hover({ position: { x: 5, y: 5 } });
    await row.locator('[data-composite-cell] button').first().click();
    const dialog = page.getByRole('dialog').first();
    await expect.poll(() => dialog.count()).toBe(1);
    const selector =
      family === 'flowbite'
        ? dialog.locator('select').first()
        : family === 'shadcn'
          ? dialog.locator('[data-slot="select-trigger"]').first()
          : dialog.locator('[role="combobox"]').first();
    const selectedLabel = async () =>
      family === 'flowbite'
        ? selector.locator('option:checked').innerText()
        : family === 'skeleton'
          ? selector.inputValue()
          : selector.innerText();
    if (expected === '' && family === 'skeleton') {
      await expect.poll(selectedLabel).toBe('');
      await expect
        .poll(() => selector.getAttribute('placeholder'))
        .toBe(messages[locale]['mixed.typePlaceholder']);
    } else {
      await expect
        .poll(selectedLabel)
        .toContain(expected || messages[locale]['mixed.typePlaceholder']);
    }
    await dialog
      .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
      .click();
    await expect.poll(() => dialog.count()).toBe(0);
  }
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const dataEditor = page.locator('.monaco-editor:visible');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await dataEditor.locator('.inputarea, .native-edit-context').focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    })
    .toEqual(original);
  expect(errors).toEqual([]);
});

for (const structured of ['object', 'array'] as const) {
  demoTest(
    `mixed-table-${structured}-type-change`,
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
        `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page
        .getByRole('tab', {
          name: translations[locale]['mixedCells.navigation.label'],
          exact: true,
        })
        .click();
      const row = page
        .getByRole('table')
        .first()
        .locator('tbody tr')
        .nth(structured === 'object' ? 5 : 6);
      await row.locator('[data-composite-cell]').hover({ position: { x: 5, y: 5 } });
      await row.locator('[data-composite-cell] button').first().click();
      const dialog = page.getByRole('dialog').first();
      await expect.poll(() => dialog.count()).toBe(1);
      const chooseString = async () => {
        if (family === 'flowbite') {
          await dialog.locator('select').first().selectOption({ label: 'string' });
        } else {
          await (
            family === 'shadcn'
              ? dialog.locator('[data-slot="select-trigger"]').first()
              : dialog.locator('[data-part="trigger"]').first()
          ).click();
          if (family === 'skeleton') {
            const contentId = await dialog
              .locator('[role="combobox"]')
              .first()
              .getAttribute('aria-controls');
            await page.locator(`[id="${contentId}"] [data-part="item"][data-value="0"]`).click();
          } else {
            await page.getByRole('option', { name: 'string', exact: true }).click();
          }
        }
      };
      await chooseString();
      const confirmation = page
        .getByRole('dialog')
        .filter({ hasText: messages[locale]['confirm.typeChange.title'] })
        .last();
      await expect.poll(() => confirmation.count()).toBe(1);
      await confirmation
        .getByRole('button', { name: messages[locale]['confirm.decline'], exact: true })
        .click();
      await expect.poll(() => confirmation.count()).toBe(0);
      await chooseString();
      await expect.poll(() => confirmation.count()).toBe(1);
      await confirmation
        .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
        .click();
      await expect.poll(() => confirmation.count()).toBe(0);
      await dialog
        .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
        .click();
      await expect.poll(() => dialog.count()).toBe(0);

      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const dataEditor = page.locator('.monaco-editor:visible');
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await expect
        .poll(async () => {
          await dataEditor.locator('.inputarea, .native-edit-context').focus();
          await page.keyboard.press('ControlOrMeta+A');
          await page.keyboard.press('ControlOrMeta+C');
          return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
        })
        .toEqual({
          ...original,
          mixedRows: original.mixedRows.map((entry, index) =>
            index === (structured === 'object' ? 5 : 6) ? { ...entry, value: '' } : entry,
          ),
        });
      expect(errors).toEqual([]);
    },
  );
}
