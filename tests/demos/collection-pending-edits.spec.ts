import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/translations.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('collection-pending-edits', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const panel = page.getByRole('tabpanel', {
    name: translations[locale]['featureNavigation.section1.label'],
    exact: true,
  });
  const table = panel.getByRole('table').first();
  const input = table.locator('input[type="text"]').first();
  await input.waitFor();
  const remove = table.getByRole('button', {
    name: messages[locale]['array.removeAriaLabel'],
    exact: true,
  });
  const removeWithoutBlur = () => remove.evaluate((node) => (node as HTMLButtonElement).click());
  await input.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (node as HTMLInputElement).value = 'pending code';
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await removeWithoutBlur();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  expect(await page.getByRole('dialog').count()).toBe(0);
  expect(await input.inputValue()).toBe('pending code');
  await input.evaluate((node) =>
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })),
  );
  await removeWithoutBlur();
  const dialog = page.getByRole('dialog', {
    name: translations[locale]['confirm.delete.title'],
    exact: true,
  });
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
    .click();
  await expect.poll(() => dialog.count()).toBe(0);
  const expected = structuredClone(original);
  expected.lines[0].code = 'pending code';
  const expectData = async () => {
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const editor = page.locator('.monaco-editor:visible');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await editor.locator('.inputarea, .native-edit-context').focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
  };
  await expectData();
  await removeWithoutBlur();
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
    .click();
  expected.lines = [];
  await expectData();
  expect(errors).toEqual([]);
});
