import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import labels from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import original from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('array-layout Add tooltip', async ({ page, family, locale, webcomponent, base }) => {
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
  const tabName = labels[locale]['expandableTab.label'];
  await page.getByRole('tab', { name: tabName, exact: true }).click();
  const panel = page.getByRole('tabpanel', { name: tabName, exact: true });
  const addPrefix = messages[locale]['array.addAriaLabelWithLabel'].split('{label}')[0];
  const addButton = panel.locator(`button[aria-label^=${JSON.stringify(addPrefix)}]`).first();
  expect(await addButton.count()).toBe(1);
  const hint = async (button: typeof addButton, label: string | RegExp) => {
    await button.focus();
    const tooltip = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({ hasText: label })
      .first();
    await tooltip.waitFor({ timeout: 3000 });
    expect(await tooltip.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await tooltip.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    await page.keyboard.press('Escape');
    await expect.poll(() => tooltip.isVisible(), { timeout: 3000 }).toBe(false);
    expect(
      await button.evaluate(
        (element) => (element.getRootNode() as Document | ShadowRoot).activeElement === element,
      ),
    ).toBe(true);
  };
  const downButton = panel
    .getByRole('button', { name: messages[locale]['array.downAriaLabel'], exact: true })
    .first();
  await hint(downButton, messages[locale]['array.down']);
  const removeButton = panel
    .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true })
    .first();
  await hint(removeButton, messages[locale]['array.removeTooltip']);
  await downButton.click();
  await hint(addButton, messages[locale]['array.addTooltipWithLabel'].split('{label}')[0]);
  await addButton.click();
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      const speakers = (
        JSON.parse(await page.evaluate(() => navigator.clipboard.readText())) as typeof original
      ).speakers;
      return { count: speakers.length, first: speakers[0]?.name, second: speakers[1]?.name };
    })
    .toEqual({
      count: original.speakers.length + 1,
      first: original.speakers[1].name,
      second: original.speakers[0].name,
    });
  expect(errors).toEqual([]);
});
