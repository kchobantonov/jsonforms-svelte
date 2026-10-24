import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('collection-actions', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const panel = page.getByRole('tabpanel', {
    name: translations[locale]['tableTab.label'],
    exact: true,
  });
  const table = panel.getByRole('table');
  const input = table.getByRole('textbox').first();
  await input.waitFor();
  const action = (name: 'down' | 'up', index: number) =>
    panel
      .getByRole('button', { name: messages[locale][`array.${name}AriaLabel`], exact: true })
      .nth(index)
      .evaluate((node) => (node as HTMLButtonElement).click());
  await input.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (node as HTMLInputElement).value = 'Draft session';
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await action('down', 0);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  expect(await input.inputValue()).toBe('Draft session');
  await input.evaluate((node) =>
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })),
  );
  await action('down', 0);
  await expect
    .poll(() => table.getByRole('row').nth(2).getByRole('textbox').first().inputValue())
    .toBe('Draft session');
  const expected = {
    ...structuredClone(original),
    sessions: structuredClone(original.sessions) as unknown[],
  };
  (expected.sessions[0] as { title: string }).title = 'Draft session';
  expected.sessions.reverse();
  const expectData = async () => {
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
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
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
  };
  await expectData();
  await action('up', 1);
  expected.sessions.reverse();
  await expectData();
  const addLabel = messages[locale]['array.addAriaLabelWithLabel'].split('{label}');
  const add = panel.locator(
    `button[aria-label^="${addLabel[0]}"]${addLabel[1] ? `[aria-label$="${addLabel[1]}"]` : ''}`,
  );
  await add.waitFor();
  await add.evaluate((node) => {
    (node as HTMLButtonElement).click();
    (node as HTMLButtonElement).click();
  });
  expected.sessions.push({});
  await expectData();
  expect(errors).toEqual([]);
});
