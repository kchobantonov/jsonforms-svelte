import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import labels from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'list-detail-identity',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.getByRole('tab', { name: labels[locale]['listTab.label'], exact: true }).click();
    const panel = page.getByRole('tabpanel', {
      name: labels[locale]['listTab.label'],
      exact: true,
    });
    const items = panel.locator('[role="option"], button[aria-current]');
    await items.nth(1).click();
    const name = panel.getByRole('textbox', {
      name: fields[locale][
        'specArrayControls.schema.properties.sponsors.items.properties.name.label'
      ],
      exact: true,
    });
    const notes = panel.getByRole('textbox', {
      name: fields[locale][
        'specArrayControls.schema.properties.sponsors.items.properties.notes.label'
      ],
      exact: true,
    });
    await expect.poll(() => name.inputValue()).toBe('Calder Coffee');
    const editor = await name.elementHandle();
    await notes.fill('Retained selected draft');
    const remove = (index: number) =>
      panel
        .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true })
        .nth(index)
        .evaluate((node) => (node as HTMLButtonElement).click());
    const dialog = page.getByRole('dialog', {
      name: messages[locale]['confirm.delete.title'],
      exact: true,
    });
    await remove(0);
    await dialog
      .getByRole('button', { name: messages[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => dialog.count()).toBe(0);
    expect(await name.evaluate((node, previous) => node === previous, editor)).toBe(true);
    expect(await notes.inputValue()).toBe('Retained selected draft');
    await remove(0);
    await dialog
      .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
      .click();
    await expect.poll(() => items.count()).toBe(1);
    expect(await name.inputValue()).toBe('Calder Coffee');
    expect(await name.evaluate((node, previous) => node === previous, editor)).toBe(true);
    expect(await notes.inputValue()).toBe('Retained selected draft');

    const expected = structuredClone(original);
    expected.sponsors = [{ ...original.sponsors[1], notes: 'Retained selected draft' }];
    const expectData = async () => {
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await expect
        .poll(async () => {
          await page
            .locator(
              '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
            )
            .focus();
          await page.keyboard.press('ControlOrMeta+A');
          await page.keyboard.press('ControlOrMeta+C');
          return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
        })
        .toEqual(expected);
      await page
        .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
        .click();
      await page.getByRole('tab', { name: labels[locale]['listTab.label'], exact: true }).click();
    };
    await expectData();
    await items.first().click();
    await remove(0);
    await dialog
      .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
      .click();
    await expect.poll(() => panel.getByRole('textbox').count()).toBe(0);
    expected.sponsors = [];
    await expectData();
    expect(errors).toEqual([]);
  },
  { timeout: 15_000 },
);
