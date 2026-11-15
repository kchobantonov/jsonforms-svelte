import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import schema from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/data.json';
import fields from '@chobantonov/jsonforms-extended-spec/examples/temporal-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'native-time-offset-bounds',
  async ({ page, family, locale, base }) => {
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
    await page.goto(`${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=false`);

    const replaceEditor = async (kind: 'Schema' | 'Data' | 'Config', value: unknown) => {
      const label = demoEditorLabel(locale, kind);
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
      await editor.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await editor.evaluate((element, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, JSON.stringify(value));
      await toolbar.getByRole('button').nth(1).click();
    };

    const boundedSchema = structuredClone(schema);
    const timeSchema = boundedSchema.properties.schemaBased.properties.time as Record<
      string,
      unknown
    >;
    timeSchema.formatMinimum = '09:00:00Z';
    timeSchema.formatExclusiveMaximum = '13:00:00Z';
    const boundedData = structuredClone(data);
    boundedData.schemaBased.time = '11:00:00Z';
    await replaceEditor('Schema', boundedSchema);
    await replaceEditor('Data', boundedData);
    await replaceEditor('Config', { showActions: true, views: ['hours'], timeFormat: 'HH:mm' });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.0.label'],
        exact: true,
      })
      .click();
    const control = page.locator('[id="#/properties/schemaBased/properties/time"]');
    await control
      .getByRole('button', {
        name: messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
        exact: true,
      })
      .click();
    const hour = page.getByRole('spinbutton', {
      name: messages[locale]['temporal.hours'],
      exact: true,
    });
    await hour.waitFor();
    const firstHour = Number(await hour.inputValue());
    const step = async (direction: 0 | 1, expectedHour: number) => {
      await hour.evaluate((node, direction) => {
        let parent = node.parentElement!;
        while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
        parent.querySelectorAll<HTMLButtonElement>('button')[direction]!.click();
      }, direction);
      await expect.poll(async () => Number(await hour.inputValue())).toBe(expectedHour);
    };
    await step(0, (firstHour + 1) % 24);
    await hour.evaluate((node) => {
      let parent = node.parentElement!;
      while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
      parent.querySelectorAll<HTMLButtonElement>('button')[0]!.click();
    });
    await expect
      .poll(() => page.getByText(messages[locale]['time.outOfRange']).isVisible())
      .toBe(true);
    expect(Number(await hour.inputValue())).toBe((firstHour + 1) % 24);
    await step(1, firstHour);
    await step(1, (firstHour + 23) % 24);
    await page.getByRole('button', { name: messages[locale]['temporal.ok'], exact: true }).click();

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const readTime = async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      const current = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      return current.schemaBased.time as string;
    };
    await expect
      .poll(async () => new Date(`2020-01-01T${await readTime()}`).toISOString())
      .toBe('2020-01-01T10:00:00.000Z');

    const honolulu =
      (await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)) ===
      'Pacific/Honolulu';
    const initialMinimum = honolulu ? '00:00:00' : '09:00:00Z';
    const raisedMinimum = honolulu ? '01:00:00' : '11:00:00Z';
    const dynamicSchema = structuredClone(boundedSchema);
    (
      dynamicSchema.properties.schemaBased.properties.time as Record<string, unknown>
    ).formatMinimum = {
      $data: '1/min',
    };
    (dynamicSchema.properties.schemaBased.properties as Record<string, unknown>).min = {
      type: 'string',
    };
    const dynamicData = structuredClone(boundedData) as typeof boundedData & {
      schemaBased: { min: string };
    };
    dynamicData.schemaBased.min = initialMinimum;
    dynamicData.schemaBased.time = '11:00:00Z';
    await replaceEditor('Schema', dynamicSchema);
    await replaceEditor('Data', dynamicData);
    await replaceEditor('Config', {
      showActions: false,
      views: ['hours'],
      timeFormat: 'HH:mm',
      timeSaveFormat: 'HH:mm:ss.SSSZ',
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.0.label'],
        exact: true,
      })
      .click();
    await control
      .getByRole('button', {
        name: messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
        exact: true,
      })
      .click();
    await step(1, (firstHour + 23) % 24);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect.poll(readTime).toMatch(/^\d{2}:00:00\.000(?:Z|[+-]\d{2}:\d{2})$/);
    await expect
      .poll(async () => new Date(`2020-01-01T${await readTime()}`).toISOString())
      .toBe('2020-01-01T10:00:00.000Z');

    dynamicData.schemaBased.min = raisedMinimum;
    dynamicData.schemaBased.time = '11:00:00Z';
    await replaceEditor('Data', dynamicData);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.0.label'],
        exact: true,
      })
      .click();
    await control
      .getByRole('button', {
        name: messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
        exact: true,
      })
      .click();
    await hour.waitFor();
    await hour.evaluate((node) => {
      let parent = node.parentElement!;
      while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
      parent.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
    });
    await expect
      .poll(() => page.getByText(messages[locale]['time.outOfRange']).isVisible())
      .toBe(true);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect.poll(readTime).toBe('11:00:00Z');

    await replaceEditor('Config', {
      showActions: false,
      restrict: false,
      views: ['hours'],
      timeFormat: 'HH:mm',
      timeSaveFormat: 'HH:mm:ss.SSSZ',
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.0.label'],
        exact: true,
      })
      .click();
    await control
      .getByRole('button', {
        name: messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
        exact: true,
      })
      .click();
    await step(1, (firstHour + 23) % 24);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect
      .poll(async () => new Date(`2020-01-01T${await readTime()}`).toISOString())
      .toBe('2020-01-01T10:00:00.000Z');
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], timeout: 60_000 },
);
