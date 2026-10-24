import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';
import supplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/supplemental-translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('choice-cards', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const catalog = translations[locale];
  await page.getByRole('tab', { name: catalog['cards.detailModes.label'], exact: true }).click();
  const registered = page.getByRole('textbox', {
    name: catalog['cards.registeredAddress.label'],
    exact: true,
  });
  await expect.poll(() => registered.inputValue()).toBe('hello@example.com');
  const addresses = page.locator('input[id*="/properties/address"]:visible');
  const postal = page.getByRole('radio', {
    name: supplements[locale]['cardContact.choices.1.label'],
    exact: true,
  });
  await registered.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'changed@example.com';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await postal.first().focus();
  await postal.first().press('Space');
  // Let the attempted action finish; unfinished composition must preserve the branch.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  expect(await postal.first().isChecked()).toBe(false);
  expect(await page.getByRole('dialog').count()).toBe(0);
  expect(
    await addresses.evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value).sort(),
    ),
  ).toEqual(['changed@example.com', 'hello@example.com']);
  await registered.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  });
  // The radio still owns focus: this activation cannot depend on the input blurring.
  await postal.first().focus();
  await postal.first().press('Space');
  await page
    .getByRole('button', { name: messages[locale]['combinator.clearDialogDecline'], exact: true })
    .click();
  await expect.poll(() => page.getByRole('dialog').count()).toBe(0);
  await expect
    .poll(() =>
      addresses.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    )
    .toEqual(['changed@example.com', 'changed@example.com']);
  await postal.first().focus();
  await postal.first().press('Space');
  await page
    .getByRole('button', { name: messages[locale]['combinator.clearDialogAccept'], exact: true })
    .click();
  await expect.poll(() => page.getByRole('dialog').count()).toBe(0);
  const streets = page.locator('input[id*="/properties/street"]:visible');
  await expect.poll(() => streets.count()).toBe(2);
  await streets.first().fill('Parity street');
  await expect.poll(() => streets.nth(1).inputValue()).toBe('Parity street');
  expect(await postal.first().isChecked()).toBe(true);
  expect(await postal.nth(1).isChecked()).toBe(true);
  expect(await registered.count()).toBe(0);
  expect(errors).toEqual([]);
});
