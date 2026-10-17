import { demoEditorLabel } from '../helpers/demo-labels';
import assert from 'node:assert/strict';
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
  const picker = page.getByLabel(text('Print spot color', 'Печатен цвят'), { exact: true });
  assert.equal(await picker.getAttribute('type'), 'color');
  assert.equal(await picker.inputValue(), '#8c4a9e');
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
  assert.ok((await data.innerText()).replaceAll('\u00a0', ' ').includes('hsb(0, 100%, 100%)'));
  assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
  console.log(`PASS color-control ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`);
});
