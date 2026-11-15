import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import fields from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import original from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/data.json';

demoTest(
  'temporal-config-views',
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
      `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const configLabel = demoEditorLabel(locale, 'Config');
    await page.getByRole('tab', { name: configLabel, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: configLabel, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await editor.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData(
        'text/plain',
        JSON.stringify({ views: ['year', 'month', 'hours', 'minutes'], showActions: true }),
      );
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await toolbar.getByRole('button').nth(1).click();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.1.label'],
        exact: true,
      })
      .click();
    await expect
      .poll(() =>
        page
          .getByText(
            fields[locale]['specTemporalControls.ui.elements.1.elements.1.elements.10.text'],
          )
          .isVisible(),
      )
      .toBe(true);

    const control = page.locator('[id="#/properties/uiSchemaBased/properties/datetime"]');
    const input = control.locator('input[id$="-input"]');
    const before = await input.inputValue();
    expect(before).toBe('02-11-26 03:05 pm');
    const open = control.getByRole('button', {
      name: messages[locale][
        family === 'flowbite' ? 'temporal.openDateTime' : 'temporal.chooseDateTime'
      ],
      exact: true,
    });
    await open.click();
    const month = page.getByRole('combobox', {
      name: messages[locale]['temporal.month'],
      exact: true,
    });
    await expect.poll(() => month.isVisible()).toBe(true);
    await month.selectOption(family === 'flowbite' ? '11' : '12');
    await expect.poll(() => input.inputValue()).toBe(before);
    await page
      .getByRole('button', { name: messages[locale]['temporal.cancel'], exact: true })
      .click();
    await expect.poll(() => input.inputValue()).toBe(before);
    await open.click();
    await expect.poll(() => month.inputValue()).toBe(family === 'flowbite' ? '10' : '11');
    await month.selectOption(family === 'flowbite' ? '11' : '12');
    await page.getByRole('button', { name: messages[locale]['temporal.ok'], exact: true }).click();
    await expect.poll(() => month.isVisible()).toBe(false);

    const coarseDate = page.locator('[id="#/properties/uiSchemaBased/properties/month"]');
    const coarseInput = coarseDate.locator('input[id$="-input"]');
    const coarseBefore = await coarseInput.inputValue();
    expect(coarseBefore).toBe('2027.01');
    const openDate = coarseDate.getByRole('button', {
      name: messages[locale][family === 'flowbite' ? 'temporal.openDate' : 'temporal.chooseDate'],
      exact: true,
    });
    await openDate.click();
    const coarseMonth =
      family === 'flowbite'
        ? coarseDate.getByRole('combobox', {
            name: messages[locale]['temporal.month'],
            exact: true,
          })
        : page
            .getByRole('combobox', { name: messages[locale]['temporal.month'], exact: true })
            .last();
    await coarseMonth.selectOption(family === 'flowbite' ? '1' : '2');
    await expect.poll(() => coarseInput.inputValue()).toBe(coarseBefore);
    await page
      .getByRole('button', { name: messages[locale]['temporal.cancel'], exact: true })
      .click();
    await expect.poll(() => coarseInput.inputValue()).toBe(coarseBefore);
    await openDate.click();
    await expect.poll(() => coarseMonth.inputValue()).toBe(family === 'flowbite' ? '0' : '1');
    await coarseMonth.selectOption(family === 'flowbite' ? '1' : '2');
    await page.getByRole('button', { name: messages[locale]['temporal.ok'], exact: true }).click();
    await expect.poll(() => coarseInput.inputValue()).toBe('2027.02');
    await expect.poll(() => input.inputValue()).toBe('02-12-26 03:05 pm');

    const timeControl = page.locator('[id="#/properties/uiSchemaBased/properties/time"]');
    const timeInput = timeControl.locator('input[id$="-input"]');
    const timeBefore = await timeInput.inputValue();
    const openTime = timeControl.getByRole('button', {
      name: messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
      exact: true,
    });
    await openTime.click();
    const afternoon = page.locator(
      `button[aria-label="${messages[locale]['temporal.pmAriaLabel']}"]`,
    );
    await expect
      .poll(async () => {
        const labels = await afternoon.allTextContents();
        return (
          labels.length > 0 &&
          labels.every((label) => label.trim() === messages[locale]['temporal.pm'])
        );
      })
      .toBe(true);
    const hours = page.getByRole('spinbutton', {
      name: messages[locale]['temporal.hours'],
      exact: true,
    });
    await hours.fill('10');
    await expect.poll(() => timeInput.inputValue()).toBe(timeBefore);
    await page
      .getByRole('button', { name: messages[locale]['temporal.cancel'], exact: true })
      .click();
    await expect.poll(() => timeInput.inputValue()).toBe(timeBefore);
    await openTime.click();
    await expect.poll(async () => Number(await hours.inputValue())).toBe(8);
    await hours.fill('10');
    await page.getByRole('button', { name: messages[locale]['temporal.ok'], exact: true }).click();

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const expected = structuredClone(original) as typeof original;
    expected.uiSchemaBased.datetime = '2026/12/02 3:05 pm';
    expected.uiSchemaBased.month = '2027-02';
    expected.uiSchemaBased.time = '10:00';
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

    await page.getByRole('tab', { name: configLabel, exact: true }).click();
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await editor.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData(
        'text/plain',
        JSON.stringify({ views: ['year', 'month', 'hours', 'minutes'], showActions: false }),
      );
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await toolbar.getByRole('button').nth(1).click();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.1.label'],
        exact: true,
      })
      .click();
    await open.click();
    await expect
      .poll(() => page.getByRole('button', { name: messages[locale]['temporal.cancel'] }).count())
      .toBe(0);
    await month.selectOption(family === 'flowbite' ? '0' : '1');
    await expect.poll(() => input.inputValue()).toBe('02-01-26 03:05 pm');
    await open.click();
    await expect.poll(() => month.isVisible()).toBe(false);
    await openDate.click();
    await coarseMonth.selectOption(family === 'flowbite' ? '2' : '3');
    await expect.poll(() => coarseInput.inputValue()).toBe('2027.03');
    await openDate.click();
    await expect.poll(() => coarseMonth.isVisible()).toBe(false);
    await openTime.click();
    await hours.fill('11');
    await expect.poll(() => timeInput.inputValue()).not.toBe(timeBefore);

    expected.uiSchemaBased.datetime = '2026/01/02 3:05 pm';
    expected.uiSchemaBased.month = '2027-03';
    expected.uiSchemaBased.time = '11:00';
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
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
  { timeout: 20_000 },
);
