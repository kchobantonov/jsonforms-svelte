import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';
import initialData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/data.json';

demoTest(
  'choice-composite-values',
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
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const catalog = translations[locale];
    const category = () =>
      page
        .getByRole('tab', { name: catalog['compositeChoices.navigation.label'], exact: true })
        .click();
    await category();
    const choiceLabel = (choice: ReturnType<typeof page.locator>) =>
      choice.evaluate((element) =>
        element instanceof HTMLSelectElement
          ? element.selectedOptions[0]?.textContent?.trim()
          : element instanceof HTMLInputElement
            ? element.value
            : element.textContent?.trim(),
      );
    const selectedLabel = (scope: string) =>
      choiceLabel(page.locator(`[id*="/properties/${scope}-input"]`).first());
    await expect
      .poll(() => selectedLabel('arrayDropdown'))
      .toBe(catalog['compositeChoices.option1.title']);
    const rowSection = page
      .getByText(catalog['compositeChoices.rows.label'], { exact: true })
      .locator('..')
      .locator('..')
      .locator('..');
    await expect.poll(() => rowSection.locator('[id$="-input"]').count()).toBe(2);
    const rowChoices = rowSection.locator('[id$="-input"]');
    await expect
      .poll(() => choiceLabel(rowChoices.nth(0)))
      .toBe(catalog['compositeChoices.option1.title']);
    await expect
      .poll(() => choiceLabel(rowChoices.nth(1)))
      .toBe(catalog['compositeChoices.option1.title']);
    const radios = (scope: 'objectRadio' | 'arrayRadio') =>
      page.getByRole('radiogroup', {
        name: catalog[`compositeChoices.${scope}.label`],
        exact: true,
      });
    for (const scope of ['objectRadio', 'arrayRadio'] as const) {
      const group = radios(scope);
      await expect
        .poll(() => group.locator('input:checked, [role="radio"][aria-checked="true"]').count())
        .toBe(1);
      await group.getByText(catalog['compositeChoices.option0.title'], { exact: true }).click();
      await expect
        .poll(() => group.locator('input:checked, [role="radio"][aria-checked="true"]').count())
        .toBe(1);
    }
    const arrayChoice = page.locator('[id*="/properties/arrayDropdown-input"]').first();
    if (family === 'flowbite') {
      await arrayChoice.selectOption({ label: catalog['compositeChoices.option0.title'] });
    } else if (family === 'skeleton') {
      await arrayChoice.fill(catalog['compositeChoices.option0.title']);
      await arrayChoice.press('ArrowDown');
      await arrayChoice.press('Enter');
    } else {
      await arrayChoice.click();
      await page
        .getByRole('option', { name: catalog['compositeChoices.option0.title'], exact: true })
        .click();
    }
    await expect
      .poll(() => selectedLabel('arrayDropdown'))
      .toBe(catalog['compositeChoices.option0.title']);
    const rowObject = rowChoices.nth(0);
    if (family === 'flowbite') {
      await rowObject.selectOption({ label: catalog['compositeChoices.option0.title'] });
    } else if (family === 'skeleton') {
      await rowObject.fill(catalog['compositeChoices.option0.title']);
      await rowObject.press('ArrowDown');
      await rowObject.press('Enter');
    } else {
      await rowObject.click();
      await page
        .getByRole('option', { name: catalog['compositeChoices.option0.title'], exact: true })
        .click();
    }
    await expect.poll(() => choiceLabel(rowObject)).toBe(catalog['compositeChoices.option0.title']);
    const rowArray = rowChoices.nth(1);
    if (family === 'flowbite') {
      await rowArray.selectOption({ label: catalog['compositeChoices.option0.title'] });
    } else if (family === 'skeleton') {
      await rowArray.fill(catalog['compositeChoices.option0.title']);
      await rowArray.press('ArrowDown');
      await rowArray.press('Enter');
    } else {
      await rowArray.click();
      await page
        .getByRole('option', { name: catalog['compositeChoices.option0.title'], exact: true })
        .click();
    }
    await expect.poll(() => choiceLabel(rowArray)).toBe(catalog['compositeChoices.option0.title']);
    // The Flowbite choice adapter coalesces changes for 300 ms; keep it mounted until commit.
    if (family === 'flowbite') await page.waitForTimeout(350);

    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    await editor.click({ position: { x: 80, y: 20 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const expected = structuredClone(initialData);
    expected.objectRadio = { mode: 'email', settings: { priority: 1 } };
    expected.arrayDropdown = ['email', { priority: 1 }];
    expected.arrayRadio = ['email', { priority: 1 }];
    expected.compositeRows[0].objectChoice = { mode: 'email', settings: { priority: 1 } };
    expected.compositeRows[0].arrayChoice = ['email', { priority: 1 }];
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    const reloaded = structuredClone(expected);
    reloaded.objectRadio = { settings: { priority: 1 }, mode: 'email' };
    reloaded.compositeRows[0].objectChoice = { settings: { priority: 1 }, mode: 'email' };
    await applyDemoEditor(page, locale, 'Data', reloaded);
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    await category();
    await expect
      .poll(() => selectedLabel('arrayDropdown'))
      .toBe(catalog['compositeChoices.option0.title']);
    await expect
      .poll(() => choiceLabel(rowChoices.nth(0)))
      .toBe(catalog['compositeChoices.option0.title']);
    await expect
      .poll(() => choiceLabel(rowChoices.nth(1)))
      .toBe(catalog['compositeChoices.option0.title']);
    for (const scope of ['objectRadio', 'arrayRadio'] as const) {
      await expect
        .poll(() =>
          radios(scope).locator('input:checked, [role="radio"][aria-checked="true"]').count(),
        )
        .toBe(1);
      await expect
        .poll(() =>
          radios(scope)
            .locator('input:checked, [role="radio"][aria-checked="true"]')
            .first()
            .evaluate((node) => node.getAttribute('value') ?? node.getAttribute('data-value')),
        )
        .toBe('choice-0');
    }
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    await expect
      .poll(async () => {
        await editor.locator('.inputarea, .native-edit-context').focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(reloaded);
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
