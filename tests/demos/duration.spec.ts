import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import { mkdir } from 'node:fs/promises';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';
import data from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/data.json';

demoTest('duration', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const duration = page.getByRole('combobox', {
    name: fields[locale][
      'specTemporalControls.schema.properties.schemaBased.properties.duration.label'
    ],
    exact: true,
  });
  await expect.poll(() => duration.inputValue()).toBe(data.schemaBased.duration);
  const control = page.locator(
    `[id=${JSON.stringify((await duration.getAttribute('id'))!.replace(/-input$/, ''))}]`,
  );
  await duration.fill('P1DT');
  await duration.blur();
  await expect.poll(() => duration.inputValue()).toBe('P1DT');
  await expect.poll(() => duration.getAttribute('aria-invalid')).toBe('true');
  await duration.fill('PT90M');
  await expect.poll(() => duration.getAttribute('aria-invalid')).toBe('false');
  const open = () =>
    control.getByRole('button', { name: messages[locale]['duration.open'], exact: true }).click();
  await open();
  const minutes = page.getByRole('spinbutton', {
    name: messages[locale]['duration.minutes'],
    exact: true,
  });
  await minutes.fill('120');
  await expect
    .poll(async () => {
      const anchor = await control
        .getByRole('button', { name: messages[locale]['duration.open'], exact: true })
        .boundingBox();
      const popup = await minutes.boundingBox();
      return anchor !== null && popup !== null && Math.abs(popup.y - anchor.y) < 400;
    })
    .toBe(true);
  if (locale === 'en' && webcomponent) {
    const form = page.locator(`jsonforms-svelte-${family}`);
    await mkdir('test-results', { recursive: true });
    await page.setViewportSize({ width: 390, height: 900 });
    await duration.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect
      .poll(async () => {
        const bounds = await minutes.boundingBox();
        return bounds !== null && bounds.y > 55 && bounds.y + bounds.height < 900;
      })
      .toBe(true);
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as JsonFormsFlowbiteElement).mode = mode;
      }, mode);
      await page.screenshot({
        path: `test-results/duration-${family}-${mode}-narrow.png`,
        animations: 'disabled',
      });
    }
    await form.evaluate((element) => {
      (element as JsonFormsFlowbiteElement).mode = 'light';
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await expect.poll(() => duration.inputValue()).toBe('PT90M');
  await page
    .getByRole('button', { name: messages[locale]['duration.cancel'], exact: true })
    .click();
  await expect.poll(() => duration.inputValue()).toBe('PT90M');
  await open();
  await expect.poll(() => minutes.inputValue()).toBe('90');
  await minutes.fill('120');
  await page.getByRole('button', { name: messages[locale]['duration.ok'], exact: true }).click();
  await expect.poll(() => duration.inputValue()).toBe('PT120M');
  const weeks = page.getByRole('combobox', {
    name: fields[locale][
      'specTemporalControls.schema.properties.schemaBased.properties.weeks.label'
    ],
    exact: true,
  });
  const weeksControl = page.locator(
    `[id=${JSON.stringify((await weeks.getAttribute('id'))!.replace(/-input$/, ''))}]`,
  );
  await weeksControl
    .getByRole('button', { name: messages[locale]['duration.open'], exact: true })
    .click();
  await page
    .getByRole('spinbutton', { name: messages[locale]['duration.weeks'], exact: true })
    .fill('4');
  await expect.poll(() => weeks.inputValue()).toBe('P4W');
  await expect
    .poll(() =>
      page.getByRole('button', { name: messages[locale]['duration.ok'], exact: true }).count(),
    )
    .toBe(0);
  expect(errors).toEqual([]);
});
