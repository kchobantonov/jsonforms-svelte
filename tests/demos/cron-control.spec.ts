import assert from 'node:assert/strict';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-cron-control/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('cron-control', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const raw = page.locator('input[id*="/properties/stockSync"]:visible');
  await raw.waitFor();
  assert.equal(await raw.inputValue(), '0 0/15 * * * *');
  const picker = page
    .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
    .first();
  assert.equal((await picker.textContent())?.trim(), '');
  assert.equal(await picker.locator('svg').count(), 1);
  // Read both rectangles in one browser frame; loading styles can move the field.
  await expect
    .poll(async () =>
      picker.evaluate((button) => {
        const input = button.closest('[data-cron-input]')!.querySelector('input')!;
        const field = input.getBoundingClientRect();
        const icon = button.getBoundingClientRect();
        return {
          horizontal: icon.x >= field.x && icon.right <= field.right,
          vertical: icon.y >= field.y && icon.bottom <= field.bottom,
        };
      }),
    )
    .toEqual({ horizontal: true, vertical: true });
  if (locale === 'en' && webcomponent)
    await page
      .locator(`jsonforms-svelte-${family}`)
      .screenshot({ path: `test-results/cron-icon-${family}.png`, animations: 'disabled' });

  await page
    .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
    .first()
    .click();
  const expression = page.getByRole('textbox', {
    name: messages[locale]['cron.expression'],
    exact: true,
  });
  const panel = page.locator('[data-cron-picker]:visible');
  const period = panel.getByLabel(messages[locale]['cron.repeats'], { exact: true });
  if (await period.evaluate((element) => element.tagName === 'SELECT'))
    await period.selectOption('month');
  else {
    await period.click();
    await page
      .getByRole('option', { name: messages[locale]['cron.period.month'], exact: true })
      .click();
  }
  await panel.getByLabel(messages[locale]['cron.dayOfMonth'], { exact: true }).first().waitFor();
  const bounds = await panel.boundingBox();
  expect(bounds!.height).toBeLessThan(440);
  expect(bounds!.width).toBeLessThan(family === 'shadcn' ? 400 : 360);
  if (locale === 'en' && webcomponent) {
    await page.screenshot({
      path: `test-results/cron-compact-${family}.png`,
      animations: 'disabled',
    });
  }
  if (family === 'shadcn') {
    await panel.getByLabel(messages[locale]['cron.minute'], { exact: true }).click();
    const list = page.locator('[data-slot=select-content][data-state=open]');
    expect((await list.boundingBox())!.height).toBeLessThanOrEqual(256);
    await list.hover();
    await page.mouse.wheel(0, 2000);
    const last = list.getByRole('option', { name: '59', exact: true });
    await expect
      .poll(async () => {
        const item = await last.boundingBox();
        const box = await list.boundingBox();
        return !!item && !!box && item.y >= box.y && item.y + item.height <= box.y + box.height;
      })
      .toBe(true);
    await last.click();
    await expect.poll(() => expression.inputValue()).toContain('59');
    if (locale === 'en' && webcomponent) {
      await page.screenshot({
        path: 'test-results/cron-scroll-shadcn.png',
        animations: 'disabled',
      });
    }
    await page.keyboard.press('Escape');
  }
  await expression.fill('0 0 10 * * *');
  await page.getByRole('button', { name: messages[locale]['cron.cancel'], exact: true }).click();
  assert.equal(await raw.inputValue(), '0 0/15 * * * *');
  await page
    .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
    .first()
    .click();
  await expression.fill('0 0 11 * * *');
  await page.getByRole('button', { name: messages[locale]['cron.ok'], exact: true }).click();
  await expect.poll(() => raw.inputValue()).toBe('0 0 11 * * *');
  const clear = page
    .locator('[data-cron-input]')
    .first()
    .getByRole('button', { name: messages[locale]['control.clearValue'], exact: true });
  await page.mouse.move(0, 0);
  await raw.evaluate((element) => (element as HTMLInputElement).blur());
  await picker.evaluate((element) => (element as HTMLButtonElement).blur());
  await expect.poll(() => clear.isVisible()).toBe(false);
  await raw.hover();
  await expect.poll(() => clear.isVisible()).toBe(true);
  await page.mouse.move(0, 0);
  await expect.poll(() => clear.isVisible()).toBe(false);
  await raw.focus();
  await expect.poll(() => clear.isVisible()).toBe(true);
  const clearBox = (await clear.boundingBox())!;
  const fieldBox = (await raw.boundingBox())!;
  assert.ok(clearBox.x >= fieldBox.x && clearBox.x + clearBox.width <= fieldBox.x + fieldBox.width);
  if (locale === 'en' && webcomponent)
    await page
      .locator('[data-cron-input]')
      .first()
      .screenshot({ path: `test-results/cron-clear-${family}.png`, animations: 'disabled' });
  await clear.focus();
  assert.equal(await clear.isVisible(), true);
  await clear.press('Enter');
  await expect.poll(() => raw.inputValue()).toBe('');
  assert.equal(await clear.count(), 0);

  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section3.label'],
      exact: true,
    })
    .click();
  assert.equal(
    await page.locator('input[id*="/properties/unixFiveField"]:visible').inputValue(),
    '*/15 * * * *',
  );
  assert.equal(
    await page.locator('input[id*="/properties/quartzSevenField"]:visible').inputValue(),
    '0 0 12 ? * MON 2027',
  );
  assert.deepEqual(errors, []);
});
