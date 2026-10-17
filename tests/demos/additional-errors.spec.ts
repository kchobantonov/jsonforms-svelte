import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import demoMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import provenance from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-provenance.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-errors/translations.supplement.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-errors/translations.json';

demoTest('additional-errors', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-additional-errors?use-webcomponent=${webcomponent}&drawer=false`,
  );
  expect(
    await page
      .getByRole('link', { name: demoMessages[locale]['spec.source'], exact: true })
      .getAttribute('href'),
  ).toBe(provenance.imported.find((entry) => entry.id === 'additional-errors')!.source);
  const messages = fields[locale];
  const server = page.getByRole('tabpanel', {
    name: translations[locale]['serverTab.label'],
    exact: true,
  });
  await server
    .getByRole('button', {
      name: messages['specAdditionalErrors.ui.elements.1.elements.0.elements.1.elements.0.label'],
      exact: true,
    })
    .click();
  const emailError = server.getByText(messages['specAdditionalErrors.server.email'], {
    exact: true,
  });
  const phoneError = server.getByText(messages['specAdditionalErrors.server.phone'], {
    exact: true,
  });
  await emailError.waitFor();
  await phoneError.waitFor();
  const email = server.getByRole('textbox', {
    name: messages['specAdditionalErrors.schema.properties.contact.properties.email.label'],
    exact: true,
  });
  await email.fill('new@example.com');
  await email.blur();
  await emailError.waitFor({ state: 'hidden' });
  await phoneError.waitFor();
  await server
    .getByRole('button', {
      name: messages['specAdditionalErrors.ui.elements.1.elements.0.elements.1.elements.1.label'],
      exact: true,
    })
    .click();
  await phoneError.waitFor({ state: 'hidden' });
  const badge = page.getByTestId('form-validation-errors');
  await page
    .getByRole('tab', { name: translations[locale]['reportedTab.label'], exact: true })
    .click();
  await expect.poll(async () => (await badge.innerText()).trim()).toBe('1');
  const editor = page.locator('.jsonforms-monaco-editor:visible');
  const input = editor.locator('.inputarea, .native-edit-context');
  await input.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await input.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', '{"allow":[]}');
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
  });
  await badge.waitFor({ state: 'hidden' });
  await page
    .getByRole('tab', { name: translations[locale]['quietTab.label'], exact: true })
    .click();
  await page.locator('.jsonforms-monaco-editor:visible .monaco-editor').waitFor();
  await badge.waitFor({ state: 'hidden' });
  expect(errors).toEqual([]);
});
