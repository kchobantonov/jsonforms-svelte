import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import labels from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import fields from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'list-detail-identity',
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
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.getByRole('tab', { name: labels[locale]['listTab.label'], exact: true }).click();
    const panel = page.getByRole('tabpanel', {
      name: labels[locale]['listTab.label'],
      exact: true,
    });
    const addPrefix = messages[locale]['array.addAriaLabelWithLabel'].split('{label}')[0];
    const addButton = panel.locator(`button[aria-label^=${JSON.stringify(addPrefix)}]`).first();
    await addButton.hover();
    const tooltip = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({ hasText: /./ })
      .first();
    await tooltip.waitFor({ timeout: 3000 });
    expect(await tooltip.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await tooltip.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    await page.mouse.move(0, 0);
    await expect.poll(() => tooltip.isVisible(), { timeout: 3000 }).toBe(false);
    await addButton.focus();
    await tooltip.waitFor({ timeout: 3000 });
    await addButton.evaluate((element) => (element as HTMLButtonElement).blur());
    const removeButton = panel
      .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true })
      .first();
    await removeButton.hover();
    const removeTooltip = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({ hasText: messages[locale]['array.removeTooltip'] })
      .first();
    await removeTooltip.waitFor({ timeout: 3000 });
    expect(
      await removeTooltip.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    ).toBe(webcomponent);
    expect(
      await removeTooltip.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe('rgba(0, 0, 0, 0)');
    await page.mouse.move(0, 0);
    await expect.poll(() => removeTooltip.isVisible(), { timeout: 3000 }).toBe(false);
    await removeButton.focus();
    await removeTooltip.waitFor({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect.poll(() => removeTooltip.isVisible(), { timeout: 3000 }).toBe(false);
    expect(
      await removeButton.evaluate(
        (element) => (element.getRootNode() as Document | ShadowRoot).activeElement === element,
      ),
    ).toBe(true);
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
    const splitter = panel.getByRole('separator', {
      name: messages[locale]['splitLayout.resize'],
    });
    await expect.poll(() => splitter.count()).toBe(1);
    await expect.poll(() => splitter.getAttribute('aria-valuenow')).toBe('25');
    await splitter.focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(async () => Number(await splitter.getAttribute('aria-valuenow')))
      .toBeGreaterThan(25);
    const splitSize = await splitter.getAttribute('aria-valuenow');
    const editor = await name.elementHandle();
    await notes.fill('Retained selected draft');
    expect(await splitter.getAttribute('aria-valuenow')).toBe(splitSize);
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
    await dialog.waitFor();
    expect(await dialog.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await dialog.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
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
    expect(await splitter.getAttribute('aria-valuenow')).toBe(splitSize);

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
    await panel.locator('button[aria-label]').evaluateAll((buttons, prefix) => {
      const add = buttons.find((button) => button.getAttribute('aria-label')?.startsWith(prefix));
      if (!add) throw new Error('ListWithDetail Add button missing');
      (add as HTMLButtonElement).click();
    }, addPrefix);
    await expect.poll(() => items.count()).toBe(1);
    await expect.poll(() => name.count()).toBe(1);
    await expect.poll(() => name.inputValue()).toBe('');
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
