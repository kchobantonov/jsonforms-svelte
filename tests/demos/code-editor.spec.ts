import { demoEditorLabel } from '../helpers/demo-labels';
import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';

demoTest('code-editor', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-code-editor?use-webcomponent=${webcomponent}&drawer=false`,
  );
  // Turn on renderer-owned publication through the host's config editor.
  // This also verifies that the demo badge responds without a data edit.
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Config'), exact: true }).click();
  const configToolbar = page
    .getByRole('heading', { name: demoEditorLabel(locale, 'Config'), exact: true })
    .locator('..');
  const configInput = configToolbar.locator('..').locator('.inputarea, .native-edit-context');
  await configInput.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await configInput.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', '{"jsonformsExtended":{"propagateErrors":true}}');
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
  });
  await configToolbar.getByRole('button').nth(1).click();
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page
    .getByRole('tab', {
      name: text('Structured document', 'Структуриран документ'),
      exact: true,
    })
    .click();
  const editor = page.locator('.jsonforms-monaco-editor:visible');
  const input = editor.locator('.inputarea, .native-edit-context');
  await input.waitFor({ state: 'attached' });
  const paste = async (value: string) => {
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate((element, value) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', value);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, value);
  };
  const validityBadge = page.getByTestId('form-validation-errors');
  await validityBadge.waitFor({ state: 'hidden' });
  await paste('{ broken');
  await validityBadge.waitFor();
  assert.equal((await validityBadge.innerText()).trim(), '1');
  await page.getByText(text('Invalid JSON', 'Невалиден JSON'), { exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await editor
    .getByRole('button', {
      name: text('Maximize code editor', 'Разгъване на редактора на код'),
    })
    .click();
  await editor
    .getByRole('button', {
      name: text('Restore code editor', 'Възстановяване на редактора на код'),
    })
    .click();
  assert.ok(
    (await editor.locator('.view-lines').innerText())
      .replaceAll('\u00a0', ' ')
      .includes('{ broken'),
  );
  await paste('{"service":"warehouse","replicas":3}');
  await page
    .getByText(text('Invalid JSON', 'Невалиден JSON'), { exact: true })
    .waitFor({ state: 'hidden' });
  await validityBadge.waitFor({ state: 'hidden' });
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page
    .locator('.monaco-editor:visible .view-lines')
    .filter({ hasText: 'warehouse' })
    .waitFor();
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(`PASS code-editor ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`);
});
