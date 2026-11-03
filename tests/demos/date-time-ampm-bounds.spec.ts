import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import schema from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/schema.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/data.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'date-time-ampm-bounds',
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

    const localTime = await page.evaluate(() => ({
      start: new Date(2026, 9, 14, 11).toISOString(),
      end: new Date(2026, 9, 14, 13).toISOString(),
    }));
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
    const dateTimeSchema = boundedSchema.properties.schemaBased.properties.datetime as Record<
      string,
      unknown
    >;
    dateTimeSchema.formatMinimum = localTime.start;
    dateTimeSchema.formatMaximum = localTime.end;
    const data = structuredClone(original);
    data.schemaBased.datetime = localTime.start;
    await replaceEditor('Schema', boundedSchema);
    await replaceEditor('Data', data);
    await replaceEditor('Config', {
      ampm: true,
      showActions: true,
      views: ['hours'],
      dateTimeFormat: 'YYYY-MM-DD hh:mm a',
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

    const control = page.locator('[id="#/properties/schemaBased/properties/datetime"]');
    await control
      .getByRole('button', {
        name: messages[locale][
          family === 'flowbite' ? 'temporal.openDateTime' : 'temporal.chooseDateTime'
        ],
        exact: true,
      })
      .click();
    const hour = page.getByRole('spinbutton', {
      name: messages[locale]['temporal.hours'],
      exact: true,
    });
    await expect.poll(() => hour.inputValue()).toBe('11');
    const stepHour = async (direction: 0 | 1) => {
      await hour.evaluate((node, direction) => {
        let parent = node.parentElement!;
        while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
        parent.querySelectorAll<HTMLButtonElement>('button')[direction]!.click();
      }, direction);
    };
    await hour.evaluate((node, pmLabel) => {
      let parent = node.parentElement;
      while (
        parent &&
        !Array.from(parent.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === pmLabel,
        )
      ) {
        parent = parent.parentElement;
      }
      const pm = Array.from(parent?.querySelectorAll<HTMLButtonElement>('button') ?? []).find(
        (button) => button.textContent?.trim() === pmLabel,
      );
      if (!pm) throw new Error('Active time picker has no PM control');
      pm.click();
    }, messages[locale]['temporal.pm']);
    await expect
      .poll(() => page.getByText(messages[locale]['dateTime.outOfRange']).isVisible())
      .toBe(true);
    expect(await hour.inputValue()).toBe('11');
    await expect
      .poll(() =>
        page
          .getByRole('button', { name: messages[locale]['temporal.ok'], exact: true })
          .isDisabled(),
      )
      .toBe(true);
    await stepHour(0);
    await expect.poll(() => hour.inputValue()).toBe('12');
    await stepHour(0);
    await expect.poll(() => hour.inputValue()).toBe('1');
    await stepHour(0);
    await expect
      .poll(() => page.getByText(messages[locale]['dateTime.outOfRange']).isVisible())
      .toBe(true);
    expect(await hour.inputValue()).toBe('1');
    await expect
      .poll(() =>
        page
          .getByRole('button', { name: messages[locale]['temporal.ok'], exact: true })
          .isDisabled(),
      )
      .toBe(true);
    await stepHour(1);
    await expect.poll(() => hour.inputValue()).toBe('12');
    await stepHour(0);
    await expect.poll(() => hour.inputValue()).toBe('1');
    await expect
      .poll(() => page.getByText(messages[locale]['dateTime.outOfRange']).count())
      .toBe(0);
    await page.getByRole('button', { name: messages[locale]['temporal.ok'], exact: true }).click();

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page
          .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
          .focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        const current = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
        return new Date(current.schemaBased.datetime as string).toISOString();
      })
      .toBe(localTime.end);
    expect(errors).toEqual([]);
  },
  { timeout: 60_000 },
);
