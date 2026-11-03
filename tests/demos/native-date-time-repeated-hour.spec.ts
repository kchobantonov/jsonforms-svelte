import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import schema from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/schema.json';
import data from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/data.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'native-date-time-repeated-hour',
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

    const repeatedSchema = structuredClone(schema);
    repeatedSchema.properties.bounded.properties.slot.formatMinimum = '2026-11-01T01:30:00-05:00';
    repeatedSchema.properties.bounded.properties.slot.formatMaximum = '2026-11-01T01:45:00-05:00';
    const repeatedData = structuredClone(data);
    repeatedData.bounded.slot = '2026-11-01T01:30:00-05:00';
    await replaceEditor('Schema', repeatedSchema);
    await replaceEditor('Data', repeatedData);
    await replaceEditor('Config', {
      showActions: true,
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    });

    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.2.label'],
        exact: true,
      })
      .click();
    const control = page.locator('[id="#/properties/bounded/properties/slot"]');
    const displayAt = (value: string) =>
      page.evaluate((text) => {
        const date = new Date(text);
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      }, value);
    const expectedDisplay = await displayAt('2026-11-01T01:30:00-05:00');
    await expect.poll(() => control.locator('input').first().inputValue()).toBe(expectedDisplay);
    await control
      .getByRole('button', {
        name: messages[locale][
          family === 'flowbite' ? 'temporal.openDateTime' : 'temporal.chooseDateTime'
        ],
        exact: true,
      })
      .click();
    const apply = page.getByRole('button', {
      name: messages[locale]['temporal.ok'],
      exact: true,
    });
    await expect.poll(() => apply.isEnabled()).toBe(true);
    await page
      .getByRole('spinbutton', { name: messages[locale]['temporal.minutes'], exact: true })
      .fill('31');
    await expect.poll(() => apply.isEnabled()).toBe(true);
    await apply.click();
    await expect
      .poll(() => control.locator('input').first().inputValue())
      .toBe(await displayAt('2026-11-01T06:31:00Z'));

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
        return new Date(current.bounded.slot).toISOString();
      })
      .toBe('2026-11-01T06:31:00.000Z');
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], timeout: 60_000 },
);
