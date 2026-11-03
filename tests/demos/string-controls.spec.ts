import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-string-controls/translations.json';
import stringUiSchema from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-string-controls/uischema.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import { demoTest } from '../helpers/demo';

demoTest('string-controls', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-string-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const city = page.locator('[id="#/properties/officeCity-input"]');
  await city.waitFor();
  await city.focus();
  await city.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'にほ';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await expect.poll(() => city.inputValue()).toBe('にほ');
  await city.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = 'Sofia😀';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
  await city.press('Tab');
  const notes = page.locator('[id="#/properties/meetingNotes-input"]');
  await notes.focus();
  await notes
    .locator('xpath=ancestor::div[button][1]')
    .getByRole('button', {
      name: translations[locale]['control.clearValue'],
      exact: true,
    })
    .click();
  await expect.poll(() => notes.inputValue()).toBe('');
  expect(
    await notes.evaluate(
      (element) => element === (element.getRootNode() as Document | ShadowRoot).activeElement,
    ),
  ).toBe(true);
  await notes.fill('Updated appointment notes');
  await notes.press('Tab');
  await page
    .getByRole('tab', { name: text('Input masks', 'Маски за въвеждане'), exact: true })
    .click();
  const booking = page.locator('[id="#/properties/bookingReference-input"]');
  assert.equal(await booking.inputValue(), '482-913');
  await booking.fill('');
  await booking.pressSequentially('001234');
  await booking.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '001234';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  });
  await booking.press('Tab');
  assert.equal(await booking.inputValue(), '001-234');
  if (locale === 'en' && webcomponent) {
    await mkdir('test-results', { recursive: true });
    await page.setViewportSize({ width: 390, height: 900 });
    await booking.scrollIntoViewIfNeeded();
    const form = page.locator(`jsonforms-svelte-${family}`);
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as HTMLElement & { mode: string }).mode = mode;
      }, mode);
      await form.screenshot({
        path: `test-results/mask-${family}-${mode}-narrow.png`,
        animations: 'disabled',
      });
    }
    await form.evaluate((element) => {
      (element as HTMLElement & { mode: string }).mode = 'light';
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  const phone = page.locator('[id="#/properties/contactPhone-input"]');
  await phone.fill('+1 (503) 555-0199');
  await phone.press('Tab');
  await page
    .getByRole('tab', {
      name: text('Custom mask tokens', 'Потребителски символи за маска'),
      exact: true,
    })
    .click();
  const bay = page.locator('[id="#/properties/bayLabel-input"]');
  assert.equal(await bay.inputValue(), 'Süd');
  await bay.fill('Софя');
  await bay.press('Tab');
  assert.equal(await bay.inputValue(), 'Софя');
  await page
    .getByRole('tab', { name: text('Fallback behavior', 'Резервно поведение'), exact: true })
    .click();
  assert.equal(
    await page.locator('[id="#/properties/legacyReference-input"]').inputValue(),
    'PENDING-REVIEW',
  );
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const data = page.locator('.monaco-editor:visible .view-lines');
  await data.filter({ hasText: '001234' }).waitFor();
  const stored = (await data.innerText()).replaceAll('\u00a0', ' ');
  assert.ok(stored.includes('PENDING-REVIEW'));
  assert.ok(stored.includes('+1 (503) 555-0199'));
  assert.ok(stored.includes('Софя'));
  assert.ok(stored.includes('Sofia😀'));
  assert.ok(stored.includes('Updated appointment notes'));
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(
    `PASS string-controls ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`,
  );
});

demoTest(
  'string-controls mask alternatives and invalid imports',
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
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-string-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: locale === 'bg' ? 'Маски за въвеждане' : 'Input masks',
        exact: true,
      })
      .click();
    await expect
      .poll(() =>
        page.locator('[id="#/properties/bookingReference-input"]').getAttribute('placeholder'),
      )
      .toBe('###-###');
    await expect
      .poll(() =>
        page.locator('[id="#/properties/contactPhone-input"]').getAttribute('placeholder'),
      )
      .toBe('+1 (503) 555-0142');
    const booking = page.locator('[id="#/properties/bookingReference-input"]');
    await booking.fill('12345');
    await booking.evaluate((element) => (element as HTMLInputElement).setSelectionRange(2, 2));
    await booking.press('9');
    await expect.poll(() => booking.inputValue()).toBe('129-345');
    await expect
      .poll(() => booking.evaluate((element) => (element as HTMLInputElement).selectionStart))
      .toBe(3);
    const account = page.locator('[id="#/properties/accountNumber-input"]');
    expect(await account.getAttribute('placeholder')).toBeNull();
    await expect.poll(() => account.inputValue()).toBe('1234 5678 9012');
    await account.fill('12345678');
    await expect.poll(() => account.inputValue()).toBe('1234 5678');
    await account.fill('123456789012');
    await expect.poll(() => account.inputValue()).toBe('1234 5678 9012');

    await page
      .getByRole('tab', {
        name: locale === 'bg' ? 'Потребителски символи за маска' : 'Custom mask tokens',
        exact: true,
      })
      .click();
    const gate = page.locator('[id="#/properties/gateCode-input"]');
    await expect.poll(() => gate.inputValue()).toBe('81-4');
    await gate.fill('81');
    await expect.poll(() => gate.inputValue()).toBe('81-');
    await gate.press('Tab');
    await expect
      .poll(() =>
        page.getByText(translations[locale]['gateCode.error.pattern'], { exact: true }).isVisible(),
      )
      .toBe(true);
    await gate.fill('');
    await expect.poll(() => gate.inputValue()).toBe('');

    await page
      .getByRole('tab', {
        name: locale === 'bg' ? 'Резервно поведение' : 'Fallback behavior',
        exact: true,
      })
      .click();
    const legacy = page.locator('[id="#/properties/legacyReference-input"]');
    await expect.poll(() => legacy.inputValue()).toBe('PENDING-REVIEW');
    await legacy.focus();
    await legacy.press('Tab');
    await expect
      .poll(() =>
        page
          .getByText(translations[locale]['legacyReference.error.pattern'], { exact: true })
          .isVisible(),
      )
      .toBe(true);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect
      .poll(() => page.locator('.monaco-editor:visible .view-lines').innerText())
      .toContain('PENDING-REVIEW');
    expect(errors).toEqual([]);
  },
);

demoTest(
  'string-controls invalid mask token',
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
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-string-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const ui = structuredClone(stringUiSchema);
    const bookingOptions = ui.elements[0].elements[1].elements[1].options;
    if (!bookingOptions) throw new Error('Missing booking mask options');
    Object.assign(bookingOptions, { tokens: { '#': '[' } });
    await applyDemoEditor(page, locale, 'UI Schema', ui, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: locale === 'bg' ? 'Маски за въвеждане' : 'Input masks',
        exact: true,
      })
      .click();
    const booking = page.locator('[id="#/properties/bookingReference-input"]');
    await expect.poll(() => booking.inputValue()).toBe('482-913');
    await expect
      .poll(() =>
        page.getByText(messages[locale]['mask.invalidToken'], { exact: true }).isVisible(),
      )
      .toBe(true);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect
      .poll(() => page.locator('.monaco-editor:visible .view-lines').innerText())
      .toContain('482913');
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);
