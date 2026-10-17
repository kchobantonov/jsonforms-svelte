import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';

demoTest('button-actions', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [],
    logs: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let submittedData: Promise<unknown> | undefined;
  page.on('console', (message) => {
    if (message.type() === 'log') logs.push(message.text());
    if (message.type() === 'log' && message.text().startsWith('slowExample')) {
      // Native Svelte data is a Proxy; console preview text is not its serialized value.
      submittedData = message
        .args()[1]
        .evaluate((value) => JSON.parse(JSON.stringify(value)))
        .catch((error: unknown) => ({ snapshotError: String(error) }));
    }
  });
  const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-button-actions?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const fullName = page.locator('[id="#/properties/fullName-input"]');
  await fullName.waitFor();
  const languageButtons = await Promise.all(
    ['English', 'Български'].map((name) =>
      page.getByRole('button', { name, exact: true }).evaluate((button) => {
        const rect = button.getBoundingClientRect();
        const parent = button.parentElement!.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, parentWidth: parent.width };
      }),
    ),
  );
  for (const button of languageButtons) {
    assert.ok(Math.abs(button.width - button.parentWidth) < 2, 'Button fills its own cell');
  }
  assert.ok(Math.abs(languageButtons[0].y - languageButtons[1].y) < 2);
  assert.ok(languageButtons[1].x >= languageButtons[0].x + languageButtons[0].width);
  const initialName = await fullName.inputValue();
  assert.ok(initialName);
  const unavailable = page.getByRole('button', {
    name: text('Unavailable', 'Недостъпно'),
    exact: true,
  });
  assert.equal(await unavailable.isDisabled(), true);
  const slow = page.getByRole('button', {
    name: text('Submit slowly', 'Бавно изпращане'),
    exact: true,
  });
  await fullName.focus();
  await fullName.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'Unfinished';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  const beforeComposition = logs.length;
  await page
    .getByRole('button', { name: text('Submit', 'Изпращане'), exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  assert.equal(logs.length, beforeComposition, 'Unfinished composition blocks consumption');
  await fullName.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = 'Pending😀';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
  const before = logs.length;
  await slow.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await page.locator('button[aria-busy="true"]').waitFor();
  await page.locator('button[aria-busy="true"]').waitFor({ state: 'hidden' });
  assert.equal(logs.length, before + 1);
  assert.equal(
    ((await submittedData) as { fullName?: unknown })?.fullName,
    'Pending😀',
    'Action receives the completed draft without blur',
  );
  await page.getByRole('button', { name: text('Discard', 'Отхвърляне'), exact: true }).click();
  assert.equal(await fullName.inputValue(), '');
  await page.getByRole('button', { name: text('Reset', 'Изчистване'), exact: true }).click();
  assert.equal(await fullName.inputValue(), initialName);
  await page.getByRole('tab', { name: text('Script', 'Скрипт'), exact: true }).click();
  await page
    .getByRole('button', {
      name: text('Log the form data', 'Извеждане на данните в конзолата'),
      exact: true,
    })
    .click();
  await page
    .getByRole('button', { name: text('Declares both', 'Действие и скрипт'), exact: true })
    .click();
  assert.equal(await page.locator('[data-button-diagnostic="action.conflict"]').count(), 1);
  await page.getByRole('tab', { name: 'TypeScript', exact: true }).click();
  await page
    .getByRole('button', { name: text('Arrow function', 'Стрелкова функция'), exact: true })
    .click();
  await page
    .getByRole('button', {
      name: text('Classic function', 'Обикновена функция'),
      exact: true,
    })
    .click();
  await page
    .getByRole('button', { name: text('Async function', 'Асинхронна функция'), exact: true })
    .click();
  await page.locator('button[aria-busy="true"]').waitFor();
  await page.locator('button[aria-busy="true"]').waitFor({ state: 'hidden' });
  await page.getByRole('tab', { name: text('Action', 'Действие'), exact: true }).click();
  await page
    .getByRole('button', { name: locale === 'en' ? 'Български' : 'English', exact: true })
    .click();
  await page
    .getByRole('button', { name: locale === 'en' ? 'Изпращане' : 'Submit', exact: true })
    .waitFor();
  assert.equal(await fullName.inputValue(), initialName);
  if (webcomponent && locale === 'en') {
    const form = page.locator(`jsonforms-svelte-${family}`);
    await form.evaluate((element) => {
      (element as JsonFormsFlowbiteElement).uischema = {
        type: 'HorizontalLayout',
        elements: ['primary', 'secondary', 'alternative', 'success', 'warning', 'error'].map(
          (color) => ({ type: 'Button', label: color, color }),
        ),
      };
    });
    await page.getByRole('button', { name: 'error', exact: true }).waitFor();
    const surfaces: string[] = [];
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as JsonFormsFlowbiteElement).mode = mode;
      }, mode);
      await page.getByRole('button', { name: 'error', exact: true }).focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      assert.equal(
        await page
          .getByRole('button', { name: 'error', exact: true })
          .evaluate((button) => button.matches(':focus')),
        true,
      );
      if (family === 'skeleton') {
        const background = await form
          .locator('div')
          .first()
          .evaluate((element) => getComputedStyle(element).backgroundColor);
        assert.notEqual(background, 'rgba(0, 0, 0, 0)', 'The form supplies its themed surface');
        surfaces.push(background);
      }
      if (family === 'flowbite') {
        const contrast = await page
          .getByRole('button', { name: 'warning', exact: true })
          .evaluate((button) => {
            const style = getComputedStyle(button);
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d')!;
            const luminance = (color: string) => {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              const rgb = Array.from(context.getImageData(0, 0, 1, 1).data)
                .slice(0, 3)
                .map((value) => {
                  const channel = value / 255;
                  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
                });
              return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
            };
            const text = luminance(style.color);
            const background = luminance(style.backgroundColor);
            return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
          });
        assert.ok(contrast >= 4.5, `Warning label contrast in ${mode}: ${contrast}`);
      }
      const bounds = await form.boundingBox();
      assert.ok(bounds);
      await page.screenshot({
        path: `test-results/button-colors-${family}-${mode}.png`,
        animations: 'disabled',
        // Include the native focus ring outside the component's border box.
        clip: {
          x: bounds.x - 8,
          y: bounds.y - 8,
          width: bounds.width + 16,
          height: bounds.height + 16,
        },
      });
    }
    if (family === 'skeleton') assert.notEqual(surfaces[0], surfaces[1]);
  }
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(
    `PASS button-actions ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`,
  );
});
