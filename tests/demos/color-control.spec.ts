import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import { demoEditorLabel } from '../helpers/demo-labels';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest('color-control', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-color-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const accent = page.getByRole('textbox', { name: text('Accent', 'Акцент'), exact: true });
  await accent.waitFor();
  assert.equal(await accent.inputValue(), 'rgb(237, 80, 80)');
  const highlight = page.getByRole('textbox', {
    name: text('Highlight', 'Открояване'),
    exact: true,
  });
  assert.equal(await highlight.inputValue(), 'hsl(48, 96%, 53%)');
  await accent.fill('hsl(120, 100%, 50%)');
  await accent.press('Tab');
  const chart = page.getByRole('textbox', {
    name: text('Chart series', 'Серия в диаграма'),
    exact: true,
  });
  await chart.fill('rgb(255, 0, 0)');
  await chart.press('Tab');
  await page
    .getByRole('tab', { name: text('Picker options', 'Настройки на избора'), exact: true })
    .click();
  const statusPicker = page.locator('[id="#/properties/statusDot-picker"]');
  assert.notEqual(await statusPicker.getAttribute('data-color-trigger'), null);
  await statusPicker.click();
  await page
    .getByRole('slider', {
      name: text('Saturation and brightness', 'Наситеност и яркост'),
      exact: true,
    })
    .click();
  await page.keyboard.press('ArrowUp');
  await page.getByRole('spinbutton', { name: text('Red', 'Червено'), exact: true }).fill('83');
  await page.getByRole('spinbutton', { name: text('Green', 'Зелено'), exact: true }).fill('196');
  await page.getByRole('spinbutton', { name: text('Blue', 'Синьо'), exact: true }).fill('26');
  await page.keyboard.press('Escape');
  const picker = page.getByLabel(text('Print spot color', 'Печатен цвят'), { exact: true });
  assert.notEqual(await picker.getAttribute('data-color-trigger'), null);
  await picker.click();
  const nativePicker = page.getByRole('slider', { name: text('Hue', 'Нюанс'), exact: true });
  assert.equal(await page.locator('input[type=color]').count(), 0);
  await page
    .getByRole('slider', {
      name: text('Saturation and brightness', 'Наситеност и яркост'),
      exact: true,
    })
    .waitFor();
  await expect
    .poll(async () => {
      const anchor = await picker.boundingBox();
      const popup = await nativePicker.evaluate((element) => {
        const rect = element.parentElement!.parentElement!.getBoundingClientRect();
        return { y: rect.y, height: rect.height };
      });
      return (
        anchor !== null &&
        popup !== null &&
        Math.min(
          Math.abs(popup.y - anchor.y - anchor.height),
          Math.abs(popup.y + popup.height - anchor.y),
        ) < 40 &&
        popup.y > 55
      );
    })
    .toBe(true);
  const opacity = page.getByRole('spinbutton', {
    name: text('Opacity (%)', 'Непрозрачност (%)'),
    exact: true,
  });
  await opacity.fill('50');
  await page
    .getByRole('textbox', { name: text('Hex color', 'Шестнадесетичен цвят'), exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole('textbox', { name: text('Hex color', 'Шестнадесетичен цвят'), exact: true })
      .inputValue(),
    '#8c4a9e80',
  );
  const channelName = text('Color channels', 'Цветови канали');
  if (family === 'shadcn') {
    await page.getByRole('button', { name: channelName, exact: true }).click();
    await page.getByRole('option', { name: 'RGB', exact: true }).click();
    await page.getByRole('option', { name: 'RGB', exact: true }).waitFor({ state: 'hidden' });
  } else {
    await page.getByRole('combobox', { name: channelName, exact: true }).selectOption('rgb');
  }
  assert.equal(
    await page.getByRole('spinbutton', { name: text('Red', 'Червено'), exact: true }).inputValue(),
    '140',
  );
  if (locale === 'en' && webcomponent) {
    await mkdir('test-results', { recursive: true });
    await page.screenshot({ path: `test-results/color-channels-${family}.png` });
    await page.setViewportSize({ width: 390, height: 900 });
    const channels = page.locator('[data-color-channels]');
    await expect
      .poll(async () => {
        const bounds = await channels.boundingBox();
        return bounds !== null && bounds.x >= 0 && bounds.x + bounds.width <= 390;
      })
      .toBe(true);
    const form = page.locator(`jsonforms-svelte-${family}`);
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as JsonFormsFlowbiteElement).mode = mode;
      }, mode);
      await page.screenshot({
        path: `test-results/color-channels-${family}-${mode}-narrow.png`,
        animations: 'disabled',
      });
    }
    await form.evaluate((element) => {
      (element as JsonFormsFlowbiteElement).mode = 'light';
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.keyboard.press('Escape');
  await page
    .getByRole('tab', { name: text('Invalid values', 'Невалидни стойности'), exact: true })
    .click();
  const imported = page.getByRole('textbox', {
    name: text('Imported tint', 'Импортиран цвят'),
    exact: true,
  });
  assert.equal(await imported.inputValue(), 'color(display-p3 0.4 0.2 0.6)');
  assert.equal(await imported.getAttribute('aria-invalid'), 'true');
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const data = page.locator('.monaco-editor:visible .view-lines');
  await data.filter({ hasText: 'rgb(0, 255, 0)' }).waitFor();
  const stored = (await data.innerText()).replaceAll('\u00a0', ' ');
  assert.ok(stored.includes('hsb(0, 100%, 100%)'));
  assert.ok(stored.includes('#8c4a9e80'));
  assert.ok(stored.includes('rgb(83, 196, 26)'));
  await page.getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) }).click();
  await page
    .getByRole('tab', { name: text('Picker options', 'Настройки на избора'), exact: true })
    .click();
  await picker.click();
  await nativePicker
    .locator('..')
    .locator('..')
    .getByRole('button', { name: text('Clear value', 'Изчистване на стойността'), exact: true })
    .click();
  await expect.poll(() => picker.locator('[data-color-empty-swatch]').count()).toBe(1);
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(`PASS color-control ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`);
});
