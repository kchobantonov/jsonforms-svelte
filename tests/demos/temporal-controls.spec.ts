import { expect } from 'vite-plus/test';
import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import { demoTest } from '../helpers/demo';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('temporal-controls', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  for (const kind of ['date', 'datetime'] as const) {
    const scope = `#/properties/schemaBased/properties/${kind}`;
    const input = page.locator(`[id=${JSON.stringify(`${scope}-input`)}]`);
    await input.waitFor();
    const before = await input.inputValue();
    const action =
      kind === 'date'
        ? family === 'flowbite'
          ? 'temporal.openDate'
          : 'temporal.chooseDate'
        : family === 'flowbite'
          ? 'temporal.openDateTime'
          : 'temporal.chooseDateTime';
    const trigger = page
      .locator(`[id=${JSON.stringify(scope)}]`)
      .getByRole('button', { name: messages[locale][action], exact: true });
    await trigger.click();
    const next = page.getByRole('button', {
      name: messages[locale]['calendar.nextMonth'],
      exact: true,
    });
    const previous = page.getByRole('button', {
      name: messages[locale]['calendar.previousMonth'],
      exact: true,
    });
    await next.click();
    await previous.click();
    await expect.poll(() => input.inputValue()).toBe(before);
    const calendar = page.getByRole(family === 'flowbite' ? 'dialog' : 'application', {
      name: new RegExp(messages[locale]['calendar.name']),
    });
    await calendar.waitFor();
    const month = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2026, 9, 14)),
    );
    expect(await calendar.getByRole('button', { name: new RegExp(month) }).count()).toBeGreaterThan(
      0,
    );
    if (kind === 'date') {
      await calendar.screenshot({
        path: `test-results/calendar-${family}-${locale}-${webcomponent ? 'wc' : 'native'}.png`,
      });
      if (family === 'shadcn') {
        await calendar.locator('[data-calendar-day][data-value="2026-10-15"]').click();
        const selected = messages[locale]['calendar.selectedDate'].split('{date}')[0];
        await expect
          .poll(() => page.locator('[data-bits-announcer]').textContent())
          .toContain(selected);
        const apply = page.getByRole('button', {
          name: messages[locale]['temporal.ok'],
          exact: true,
        });
        if (await apply.isVisible()) await apply.click();
      }
    }
    if (family === 'flowbite') await page.getByRole('heading').first().click();
    else await page.keyboard.press('Escape');
    await expect.poll(() => calendar.isVisible()).toBe(false);
  }
  await page
    .getByRole('tab', {
      name: fields[locale]['specTemporalControls.ui.elements.1.elements.1.label'],
      exact: true,
    })
    .click();
  const monthInput = page.getByRole('textbox', {
    name: fields[locale]['specTemporalControls.ui.elements.1.elements.1.elements.1.label'],
    exact: true,
  });
  await expect.poll(() => monthInput.inputValue()).toBe('2027.01');
  const monthId = (await monthInput.getAttribute('id'))!.replace(/-input$/, '');
  const monthControl = page.locator(`[id=${JSON.stringify(monthId)}]`);
  await monthControl
    .getByRole('button', {
      name: messages[locale][family === 'flowbite' ? 'temporal.openDate' : 'temporal.chooseDate'],
      exact: true,
    })
    .click();
  const month = page.getByRole('combobox', {
    name: messages[locale]['temporal.month'],
    exact: true,
  });
  await month.selectOption(family === 'flowbite' ? '2' : '3');
  await page.getByRole('button', { name: messages[locale]['temporal.ok'], exact: true }).click();
  await expect.poll(() => monthInput.inputValue()).toBe('2027.03');

  const timeInput = page.getByRole('textbox', {
    name: fields[locale][
      'specTemporalControls.schema.properties.uiSchemaBased.properties.coarseTime.label'
    ],
    exact: true,
  });
  const timeId = (await timeInput.getAttribute('id'))!.replace(/-input$/, '');
  await page
    .locator(`[id=${JSON.stringify(timeId)}]`)
    .getByRole('button', {
      name: messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
      exact: true,
    })
    .click();
  const hours = page.getByRole('spinbutton', {
    name: messages[locale]['temporal.hours'],
    exact: true,
  });
  await expect.poll(() => hours.isVisible()).toBe(true);
  expect(
    await page
      .getByRole('spinbutton', { name: messages[locale]['temporal.seconds'], exact: true })
      .count(),
  ).toBe(0);
  await hours.fill('11');
  await expect.poll(() => timeInput.inputValue()).toBe('11:30:00');
  await page
    .getByRole('tab', {
      name: fields[locale]['specTemporalControls.ui.elements.1.elements.2.label'],
      exact: true,
    })
    .click();
  const boundedDate = page.getByRole('textbox', {
    name: fields[locale][
      'specTemporalControls.schema.properties.bounded.properties.bookingDate.label'
    ],
    exact: true,
  });
  const format = (await boundedDate.getAttribute('placeholder'))!;
  const dateText = (month: string) =>
    format.replace('YYYY', '2026').replace('MM', month).replace('DD', '24');
  await boundedDate.fill(dateText('12'));
  await boundedDate.blur();
  await expect.poll(() => boundedDate.inputValue()).toBe(dateText('12'));
  await expect.poll(() => boundedDate.getAttribute('aria-invalid')).toBe('true');
  await boundedDate.fill(dateText('10'));
  await boundedDate.blur();
  await expect.poll(() => boundedDate.getAttribute('aria-invalid')).toBe('false');
  if (webcomponent) {
    await page.locator(`jsonforms-svelte-${family}`).evaluate((element) => {
      const form = element as JsonFormsFlowbiteElement;
      form.config = {
        ...(typeof form.config === 'object' && form.config ? form.config : {}),
        separateReadonlyFromDisabled: true,
      };
      form.readonly = true;
    });
    await expect
      .poll(() => boundedDate.evaluate((input) => (input as HTMLInputElement).readOnly))
      .toBe(true);
    expect(await boundedDate.isDisabled()).toBe(false);
    const before = await boundedDate.inputValue();
    await boundedDate.press('9');
    expect(await boundedDate.inputValue()).toBe(before);
  }
  expect(errors).toEqual([]);
});
