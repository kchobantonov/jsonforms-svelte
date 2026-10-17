import { demoEditorLabel } from '../helpers/demo-labels';
import assert from 'node:assert/strict';
import { expect } from 'vitest';
import demoMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import { demoTest } from '../helpers/demo';

demoTest('inference', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => {
      localStorage.setItem(`${family}-example-locale`, locale);
    },
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const tab = (name: string) =>
    page.getByRole('tab', { name: demoEditorLabel(locale, name), exact: true });
  const editor = () =>
    page.locator('.monaco-editor:visible').locator('.inputarea, .native-edit-context').first();
  const apply = async (name: string, value: string) => {
    await tab(name).click();
    const toolbar = page
      .getByRole('heading', { name: demoEditorLabel(locale, name), exact: true })
      .locator('..');
    await toolbar.waitFor({ state: 'visible' });
    const activeEditor = toolbar.locator('..').locator('.monaco-editor');
    await activeEditor.locator('.inputarea, .native-edit-context').focus();
    await page.keyboard.press('ControlOrMeta+A');
    // Paste JSON as a user would; typing a whole document triggers Monaco's
    // automatic quote/bracket insertion, which changes the supplied fixture.
    await activeEditor.locator('.inputarea, .native-edit-context').evaluate((element, text) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', text);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, value);
    await activeEditor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await toolbar.getByRole('button').nth(1).click();
  };
  const demo = async () =>
    page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await tab('Schema').click();
  await editor().waitFor({ state: 'attached' });
  assert.equal((await page.locator('.monaco-editor:visible .view-lines').innerText()).trim(), '');
  await apply('Data', '"hello"');
  await demo();
  const value = page.getByRole('textbox', {
    name: locale === 'bg' ? 'JSON стойност' : 'JSON value',
    exact: true,
  });
  await value.waitFor();
  assert.equal(await value.inputValue(), 'hello');
  await value.fill('updated');
  await apply('Data', '{ invalid');
  await page
    .getByText(demoMessages[locale]['editor.error'].replace('{error}', 'SyntaxError'), {
      exact: false,
    })
    .waitFor();
  await demo();
  assert.equal(await value.inputValue(), 'updated');
  await apply('Schema', '{}');
  await demo();
  assert.equal(await value.inputValue(), 'updated');
  await apply('Schema', 'false');
  await demo();
  await value.waitFor();
  assert.equal(await value.inputValue(), 'updated');
  await apply('Schema', 'true');
  await demo();
  await value.waitFor();
  assert.equal(await value.inputValue(), 'updated');
  await apply('Schema', '   ');
  await apply('Data', '["first","second"]');
  await demo();
  await page.waitForFunction(() => {
    const inputs = [...document.querySelectorAll('input')];
    for (const host of document.querySelectorAll('*'))
      if (host.shadowRoot) inputs.push(...host.shadowRoot.querySelectorAll('input'));
    return inputs.some((input) => input.value === 'second');
  });
  // Replacing the document must replace the inferred editor without losing
  // false/zero or writing the inferred schema into the authored Schema editor.
  await apply('Data', '1.5');
  await demo();
  const scalar = page.getByLabel(locale === 'bg' ? 'JSON стойност' : 'JSON value', { exact: true });
  assert.equal(await scalar.inputValue(), '1.5');
  await scalar.fill('0');
  await scalar.press('Tab');
  await tab('Data').click();
  await page.locator('.monaco-editor:visible .view-lines').waitFor();
  await expect
    .poll(async () => (await page.locator('.monaco-editor:visible .view-lines').innerText()).trim())
    .toBe('0');
  await apply('Data', 'false');
  await demo();
  const boolean = page.getByRole('checkbox').first();
  assert.equal(await boolean.isChecked(), false);
  await boolean.check();
  await tab('Data').click();
  await expect
    .poll(async () => (await page.locator('.monaco-editor:visible .view-lines').innerText()).trim())
    .toBe('true');
  await apply('Data', '{"name":"Sample","active":false}');
  await demo();
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  assert.equal(await name.inputValue(), 'Sample');
  await name.fill('Edited');
  await name.press('Tab');
  await tab('Data').click();
  await expect
    .poll(() => page.locator('.monaco-editor:visible .view-lines').innerText())
    .toContain('Edited');
  await apply('Data', 'null');
  await demo();
  await page.getByRole('checkbox').first().waitFor();
  assert.equal(await page.getByRole('checkbox').first().isChecked(), true);
  await apply('Data', '   ');
  await demo();
  await page.locator('[id$="-input-selector"]').waitFor();
  assert.equal(await page.getByText('No applicable renderer found', { exact: false }).count(), 0);
  await apply('UI Schema', '   ');
  await demo();
  await page.locator('[id$="-input-selector"]').waitFor();
  await tab('UI Schema').click();
  const uiToolbar = page
    .getByRole('heading', { name: demoEditorLabel(locale, 'UI Schema'), exact: true })
    .locator('..');
  await uiToolbar.getByRole('button').nth(0).click();
  await uiToolbar.getByRole('button').nth(1).click();
  await apply('Data', '"reload me"');
  await demo();
  assert.equal(await value.inputValue(), 'reload me');
  await tab('Data').click();
  const dataToolbar = page
    .getByRole('heading', { name: demoEditorLabel(locale, 'Data'), exact: true })
    .locator('..');
  await dataToolbar.getByRole('button').nth(0).click();
  await dataToolbar.getByRole('button').nth(1).click();
  await demo();
  await page.locator('[id$="-input-selector"]').waitFor();
  await tab('Schema').click();
  assert.equal((await page.locator('.monaco-editor:visible .view-lines').innerText()).trim(), '');
  assert.deepEqual(errors, []);
  console.log(
    `${family} ${locale} ${webcomponent ? 'Web Component' : 'native'}: inference, invalid JSON, explicit schema and clearing passed`,
  );
});
