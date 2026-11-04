import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import demoMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import provenance from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-provenance.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-errors/translations.supplement.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-errors/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'flowbite language dropdown clear visibility',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-additional-errors?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.getByRole('tab', { name: translations[locale]['languageTab.label'] }).click();
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['languageTab.label'],
      exact: true,
    });
    const select = panel.getByRole('combobox', {
      name: fields[locale]['specAdditionalErrors.schema.properties.language.label'],
      exact: true,
    });
    const clear = panel.getByRole('button', {
      name: messages[locale]['control.clearValue'],
      exact: true,
    });
    await expect.poll(() => clear.count()).toBe(1);
    await page.locator('body').hover({ position: { x: 1, y: 1 } });
    await expect
      .poll(() => clear.evaluate((element) => getComputedStyle(element).opacity))
      .toBe('0');
    await select.hover();
    await expect
      .poll(() => clear.evaluate((element) => getComputedStyle(element).opacity))
      .toBe('1');
    await page.locator('body').hover({ position: { x: 1, y: 1 } });
    await select.focus();
    await expect
      .poll(() => clear.evaluate((element) => getComputedStyle(element).opacity))
      .toBe('1');
    await clear.click();
    await expect.poll(() => clear.count()).toBe(0);
  },
  { families: ['flowbite'] },
);

demoTest('additional-errors', async ({ page, family, locale, webcomponent, base }) => {
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
  const submit = server.getByRole('button', {
    name: messages['specAdditionalErrors.ui.elements.1.elements.0.elements.1.elements.0.label'],
    exact: true,
  });
  const breakdown = page.getByTestId('form-validation-breakdown');
  await submit.click();
  await expect
    .poll(() => breakdown.innerText())
    .toContain(demoMessages[locale]['validation.additionalCount'].replace('{count}', '3'));
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
  await expect
    .poll(() => breakdown.innerText())
    .toContain(demoMessages[locale]['validation.additionalCount'].replace('{count}', '1'));
  const summary = page.getByRole('textbox', {
    name: messages['specAdditionalErrors.schema.properties.summary.label'],
    exact: true,
  });
  await summary.fill('No');
  await summary.blur();
  await expect.poll(async () => (await badge.innerText()).trim()).toBe('2');
  await expect
    .poll(() => breakdown.innerText())
    .toContain(demoMessages[locale]['validation.schemaCount'].replace('{count}', '1'));
  await expect
    .poll(() => breakdown.innerText())
    .toContain(demoMessages[locale]['validation.additionalCount'].replace('{count}', '1'));
  await summary.fill('Ready');
  await summary.blur();
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

demoTest(
  'additional-errors remain published and translate on a locale-only change',
  async ({ page, family, webcomponent, base }) => {
    await page.addInitScript(
      (family) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: 'en' }),
        ),
      family,
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-additional-errors?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const server = page.getByRole('tabpanel', {
      name: translations.en['serverTab.label'],
      exact: true,
    });
    const submit = server.getByRole('button', {
      name: fields.en['specAdditionalErrors.ui.elements.1.elements.0.elements.1.elements.0.label'],
      exact: true,
    });
    const breakdown = page.getByTestId('form-validation-breakdown');
    await submit.click();
    await expect
      .poll(() => breakdown.innerText())
      .toContain(demoMessages.en['validation.additionalCount'].replace('{count}', '3'));
    const email = server.getByRole('textbox', {
      name: fields.en['specAdditionalErrors.schema.properties.contact.properties.email.label'],
      exact: true,
    });
    const originalEmail = await email.inputValue();
    await server
      .getByText(fields.en['specAdditionalErrors.server.email'], { exact: true })
      .waitFor();
    await server
      .getByText(fields.en['specAdditionalErrors.server.phone'], { exact: true })
      .waitFor();
    await page.getByRole('button', { name: demoMessages.en['nav.openSettings'] }).click();
    if (family === 'shadcn') {
      await page.locator('#locale').click();
      await page
        .getByRole('option', { name: demoMessages.en['settings.bulgarian'], exact: true })
        .click();
    } else {
      await page.locator('#locale').selectOption('bg');
    }
    await page.getByRole('button', { name: demoMessages.bg['nav.closeSettings'] }).last().click();
    const translatedServer = page.getByRole('tabpanel', {
      name: translations.bg['serverTab.label'],
      exact: true,
    });
    await translatedServer
      .getByText(fields.bg['specAdditionalErrors.server.email'], { exact: true })
      .waitFor();
    await translatedServer
      .getByText(fields.bg['specAdditionalErrors.server.phone'], { exact: true })
      .waitFor();
    await expect
      .poll(() => breakdown.innerText())
      .toContain(demoMessages.bg['validation.additionalCount'].replace('{count}', '3'));
    await expect
      .poll(() =>
        translatedServer
          .getByRole('textbox', {
            name: fields.bg[
              'specAdditionalErrors.schema.properties.contact.properties.email.label'
            ],
            exact: true,
          })
          .inputValue(),
      )
      .toBe(originalEmail);
    expect(
      await translatedServer.getByText(fields.en['specAdditionalErrors.server.email']).count(),
    ).toBe(0);
  },
  { locales: ['en'], timeout: 45_000 },
);
