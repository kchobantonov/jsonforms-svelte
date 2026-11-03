import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/data.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'time-ampm-steps',
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

    const replaceEditor = async (kind: 'Data' | 'Config', value: unknown) => {
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

    const data = structuredClone(original);
    data.uiSchemaBased.time = '11:00';
    await replaceEditor('Data', data);
    await replaceEditor('Config', {
      showActions: true,
      views: ['hours'],
      timeFormat: 'hh:mm a',
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.1.label'],
        exact: true,
      })
      .click();

    const control = page.locator('[id="#/properties/uiSchemaBased/properties/time"]');
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
    await expect.poll(() => hour.inputValue()).toBe('11');
    const increase = async () => {
      await hour.evaluate((node) => {
        let parent = node.parentElement!;
        while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
        parent.querySelectorAll<HTMLButtonElement>('button')[0]!.click();
      });
    };
    await increase();
    await expect.poll(() => hour.inputValue()).toBe('12');
    await increase();
    await expect.poll(() => hour.inputValue()).toBe('1');
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
        return current.uiSchemaBased.time as string;
      })
      .toBe('13:00');
    expect(errors).toEqual([]);
  },
  { timeout: 60_000 },
);
