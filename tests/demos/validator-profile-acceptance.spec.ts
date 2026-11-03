import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-validator-profile/translations.json';
import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';
import initialData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-validator-profile/data.json';

demoTest('validator-profile-live-locale', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/?ref=AB-1234&campaign=spring#/examples/spec-validator-profile?use-webcomponent=${webcomponent}&drawer=false&source=email`,
  );
  const first = translations[locale];
  const otherLocale = locale === 'en' ? 'bg' : 'en';
  const next = translations[otherLocale];

  await page.getByRole('tab', { name: first['errorsTab.label'], exact: true }).click();
  const fullName = page.locator('input[id*="/properties/fullName-input"]');
  await expect.poll(() => fullName.inputValue()).toBe('Jo');
  await fullName.focus();
  await fullName.press('Tab');
  const initialFeedback = (await page.locator('[role="alert"]:visible').allTextContents()).join(
    ' ',
  );
  expect(initialFeedback).toMatch(locale === 'bg' ? /[Ѐ-ӿ]/ : /characters|shorter/i);

  await page.getByRole('tab', { name: first['messagesTab.label'], exact: true }).click();
  await page
    .getByText(first['error.errorMessage.nicknameRequired'], { exact: true })
    .first()
    .waitFor();
  await page.getByRole('button', { name: messages[locale]['nav.openSettings'] }).click();
  if (family === 'shadcn') {
    await page.locator('#locale').click();
    await page
      .getByRole('option', {
        name: messages[locale][otherLocale === 'bg' ? 'settings.bulgarian' : 'settings.english'],
        exact: true,
      })
      .click();
  } else {
    await page.locator('#locale').selectOption(otherLocale);
  }
  await page
    .getByRole('button', { name: messages[otherLocale]['nav.closeSettings'] })
    .last()
    .click();
  await page.getByRole('tab', { name: next['messagesTab.label'], exact: true }).click();
  await page
    .getByText(next['error.errorMessage.nicknameRequired'], { exact: true })
    .first()
    .waitFor();
  await page.getByText(next['error.errorMessage.tooYoung'], { exact: true }).first().waitFor();
  await page.getByText('A postcode is four digits, like 1010.', { exact: true }).first().waitFor();
  await expect.poll(() => fullName.inputValue()).toBe('Jo');

  await page.getByRole('tab', { name: next['errorsTab.label'], exact: true }).click();
  await expect
    .poll(async () => (await page.locator('[role="alert"]:visible').allTextContents()).join(' '))
    .toMatch(otherLocale === 'bg' ? /[Ѐ-ӿ]/ : /characters|shorter/i);
  await page.getByRole('tab', { name: next['transformTab.label'], exact: true }).click();
  await expect
    .poll(() => page.locator('input[id*="/properties/code-input"]').inputValue())
    .toBe('AB-12');
  await page.getByRole('tab', { name: demoEditorLabel(otherLocale, 'Data'), exact: true }).click();
  const dataText = await page
    .locator('.monaco-editor:visible')
    .last()
    .locator('.view-lines')
    .innerText();
  expect(dataText.replaceAll('\u00a0', ' ')).toContain('"fullName": "Jo"');
  expect(errors).toEqual([]);
});

demoTest(
  'validator-profile-permission-and-dates',
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
    const warnings: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto(
      `${base}/${family}/?ref=AB-1234&campaign=spring#/examples/spec-validator-profile?use-webcomponent=${webcomponent}&drawer=false&source=email`,
    );
    await applyDemoEditor(page, locale, 'Config', { restrict: true });
    await applyDemoEditor(page, locale, 'Data', initialData);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', { name: translations[locale]['defaultsTab.label'], exact: true })
      .click();
    const value = (field: string) =>
      page.locator(`input[id*="/properties/${field}-input"]`).inputValue();
    await expect.poll(() => warnings.join(' ')).toContain('script.evaluationDisabled');
    await expect.poll(() => value('greeting')).toBe('');
    const opensOn = await value('opensOn');
    const closesOn = await value('closesOn');
    const year = Number(await value('year'));
    expect(opensOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(closesOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((Date.parse(closesOn) - Date.parse(opensOn)) / 86_400_000).toBe(14);
    expect(year).toBe(new Date().getFullYear());
    await expect
      .poll(() => page.getByRole('checkbox', { name: /Confirmed/ }).isChecked())
      .toBe(false);
    expect(errors).toEqual([]);
  },
);
