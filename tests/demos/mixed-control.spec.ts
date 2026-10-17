import assert from 'node:assert/strict';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/translations.json';
import supplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/supplemental-translations.json';

demoTest('mixed-control', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section3.label'],
      exact: true,
    })
    .click();
  const nestedLabel = supplements[locale]['mixedExampleUI/elements/0/elements/2/elements/1.label'];
  const nested = page.getByRole('button', { name: nestedLabel, exact: true });
  await nested.waitFor();
  assert.equal(await nested.getAttribute('aria-expanded'), 'true');
  const suppliers = page.locator('input:visible').filter({ visible: true });
  const supplier = page.getByRole('textbox', { name: 'supplier', exact: true }).first();
  await supplier.waitFor();
  assert.equal(await supplier.inputValue(), 'Cascade Supplies');
  await supplier.fill('Updated supplier');
  await expect
    .poll(
      async () =>
        (
          await suppliers.evaluateAll((inputs) =>
            inputs.map((input) => (input as HTMLInputElement).value),
          )
        ).filter((value) => value === 'Updated supplier').length,
    )
    .toBe(2);
  const codeLabel = supplements[locale]['mixedExampleUI/elements/0/elements/2/elements/4.label'];
  const code = page.getByRole('textbox', { name: codeLabel, exact: true });
  await code.waitFor({ state: 'attached' });
  const editor = page.locator('.monaco-editor:visible').filter({ has: code });
  await expect
    .poll(async () => (await editor.locator('.view-lines').innerText()).replaceAll('\u00a0', ' '))
    .toContain('Updated supplier');
  await nested.click();
  assert.equal(await nested.getAttribute('aria-expanded'), 'false');
  await nested.click();
  await code.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await code.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', 'null');
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
  });
  await expect
    .poll(() => page.getByRole('textbox', { name: 'supplier', exact: true }).count())
    .toBe(0);
  await page
    .getByRole('tab', {
      name: translations[locale]['mixedComposition.navigation.label'],
      exact: true,
    })
    .click();
  const composedObject = page.getByRole('button', {
    name: translations[locale]['mixedComposition.composedObject.label'],
    exact: true,
  });
  if ((await composedObject.getAttribute('aria-expanded')) === 'false')
    await composedObject.click();
  await expect
    .poll(() =>
      page
        .locator('input:visible')
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    )
    .toEqual(expect.arrayContaining(['Hello', 'Ada', 'abcd']));
  assert.deepEqual(errors, []);
});
