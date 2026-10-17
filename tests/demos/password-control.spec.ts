import { demoEditorLabel } from '../helpers/demo-labels';
import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';
import { expect } from 'vitest';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-password-control/translations.json';

demoTest('password-control', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-password-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const password = page.locator('input[id="#/properties/password-input"]');
  await password.waitFor();
  assert.equal(await password.getAttribute('type'), 'password');
  assert.equal(await password.inputValue(), 'short');
  await password.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'Secretにほ';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    input.dispatchEvent(new FocusEvent('blur'));
  });
  assert.equal(await password.inputValue(), 'Secretにほ');
  await password.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = 'Secret日😀';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
  });
  await expect.poll(() => password.inputValue()).toBe('Secret日😀');
  const reveal = page.getByRole('button', { name: messages[locale]['password.show'], exact: true });
  await reveal.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const tooltip = page.locator(
    family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible',
  );
  await expect
    .poll(() => tooltip.filter({ hasText: messages[locale]['password.show'] }).isVisible())
    .toBe(true);
  await reveal.click();
  assert.equal(await password.getAttribute('type'), 'text');
  await page
    .getByRole('tab', {
      name: text('UI format selection', 'Формат чрез UI схема'),
      exact: true,
    })
    .click();
  const recovery = page.getByLabel(text('Recovery phrase', 'Фраза за възстановяване'), {
    exact: true,
  });
  assert.equal(await recovery.getAttribute('type'), 'password');
  await page
    .getByRole('tab', { name: text('Verification code', 'Код за потвърждение'), exact: true })
    .click();
  const backup = page.getByLabel(text('Backup code', 'Резервен код'), { exact: true });
  assert.equal(await backup.inputValue(), 'ZX7Q-114P');
  assert.equal(await backup.getAttribute('type'), 'password');
  const otp =
    family === 'shadcn'
      ? page.locator('[data-pin-input-input]')
      : page
          .getByRole('group', {
            name: text('Verification code', 'Код за потвърждение'),
            exact: true,
          })
          .locator('input');
  assert.equal(await otp.count(), family === 'shadcn' ? 1 : 6);
  if (family !== 'shadcn') {
    const boxes = await otp.evaluateAll((inputs) =>
      inputs.map((input) => {
        const { x, y, width } = input.getBoundingClientRect();
        return { x, y, width };
      }),
    );
    assert.ok(
      boxes.every((box) => box.width >= 32 && box.width <= 64),
      'compact OTP boxes',
    );
    assert.ok(
      boxes.every((box) => Math.abs(box.y - boxes[0].y) < 1),
      'one OTP row',
    );
    assert.ok(boxes.at(-1)!.x + boxes.at(-1)!.width - boxes[0].x < 400, 'all boxes fit');
  }
  const pasteCode = async (value: string) => {
    await otp.first().focus();
    await otp.first().evaluate((element, value) => {
      (element as HTMLInputElement).select();
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', value);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, value);
  };
  const codeValue = () =>
    otp.evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value).join(''));
  // Native OTP adapters preserve full Unicode code points and completed composition.
  await pasteCode('😀'.repeat(7));
  await expect.poll(codeValue).toBe('😀'.repeat(6));
  await otp.first().evaluate((element, family) => {
    const input = element as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = family === 'shadcn' ? 'にほ' + '😀'.repeat(5) : 'にほ';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    input.value = family === 'shadcn' ? '日' + '😀'.repeat(5) : '日';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  }, family);
  await expect.poll(codeValue).toBe('日' + '😀'.repeat(5));
  // Paste truncates to the authored bound, retaining the leading zeroes.
  await pasteCode('001234extra');
  await expect.poll(codeValue).toBe('001234');
  assert.equal(await otp.first().getAttribute('type'), 'password');
  if (family === 'shadcn') {
    const slots = page.locator('[data-slot="input-otp-slot"]');
    assert.equal(await slots.count(), 6);
    await expect
      .poll(async () => (await slots.allTextContents()).map((text) => text.trim()).join(''))
      .toBe('••••••');
  }
  if (family === 'flowbite' && locale === 'en' && !webcomponent) {
    await otp.first().locator('xpath=ancestor::div[button][1]').screenshot({
      path: 'test-results/password-flowbite-otp.png',
    });
  }
  // The OTP and the unbounded backup field have independent reveal controls.
  const show = () =>
    page.getByRole('button', {
      name: messages[locale]['password.show'],
      exact: true,
    });
  await show().first().focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect
    .poll(() => tooltip.filter({ hasText: messages[locale]['password.show'] }).isVisible())
    .toBe(true);
  await page.keyboard.press('Enter');
  await expect.poll(() => otp.first().getAttribute('type')).toBe('text');
  assert.equal(await backup.getAttribute('type'), 'password');
  assert.equal(await codeValue(), '001234');
  await page
    .getByRole('button', {
      name: messages[locale]['password.hide'],
      exact: true,
    })
    .click();
  await expect.poll(() => otp.first().getAttribute('type')).toBe('password');
  await otp
    .first()
    .locator('xpath=ancestor::div[button][1]')
    .getByRole('button', {
      name: messages[locale]['control.clearValue'],
      exact: true,
    })
    .first()
    .click();
  await expect.poll(codeValue).toBe('');
  if (family === 'shadcn') {
    await otp.first().focus();
    await otp.first().pressSequentially('001234');
  } else {
    await pasteCode('001234');
  }
  await expect.poll(codeValue).toBe('001234');
  await otp.last().press('Tab');
  if (family === 'shadcn') {
    await expect
      .poll(() => page.locator('[data-slot="input-otp-slot"][aria-invalid="true"]').count())
      .toBe(0);
  }
  if (webcomponent && locale === 'en') {
    const form = page.locator(`jsonforms-svelte-${family}`);
    await page.setViewportSize({ width: 390, height: 900 });
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as JsonFormsFlowbiteElement).mode = mode;
      }, mode);
      await otp.first().focus();
      await form.screenshot({ path: `test-results/password-otp-${family}-${mode}-narrow.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page
    .getByRole('tab', { name: text('Table cells', 'Клетки в таблица'), exact: true })
    .click();
  const tokens = page.locator('input[type="password"]:visible');
  await tokens.first().waitFor();
  assert.equal(await tokens.count(), 2);
  assert.equal(await tokens.first().inputValue(), 'sk-live-1234567890');
  await tokens.first().fill('cell😀');
  await tokens.first().blur();
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.locator('.monaco-editor:visible .view-lines').filter({ hasText: '001234' }).waitFor();
  await page
    .locator('.monaco-editor:visible .view-lines')
    .filter({ hasText: 'Secret日😀' })
    .waitFor();
  await page.locator('.monaco-editor:visible .view-lines').filter({ hasText: 'cell😀' }).waitFor();
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(
    `PASS password-control ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`,
  );
});
