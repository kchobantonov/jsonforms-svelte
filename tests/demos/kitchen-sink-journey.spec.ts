import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import initialData from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/data.json';
import invalidData from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/invalid-data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'kitchen-sink-journey',
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
      `${base}/${family}/#/examples/spec-kitchen-sink?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const labels = translations[locale];
    const first = page.getByRole('textbox', { name: labels['firstName.label'], exact: true });
    await expect.poll(() => first.inputValue()).toBe('Ada');
    await first.fill('Grace');
    await first.blur();
    for (const key of [
      'jobStep.label',
      'referencesStep.label',
      'finishStep.label',
      'profileStep.label',
    ] as const) {
      if (family === 'skeleton')
        await page.locator('button:visible').filter({ hasText: labels[key] }).first().click();
      else await page.getByText(labels[key], { exact: true }).first().click();
    }
    await expect.poll(() => first.inputValue()).toBe('Grace');

    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    await editor.click({ position: { x: 80, y: 20 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const expected = structuredClone(initialData);
    expected.firstName = 'Grace';
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);

    const input = toolbar.locator('..').locator('.inputarea, .native-edit-context');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate((element, text) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', text);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, JSON.stringify(invalidData));
    await toolbar.getByRole('button').nth(1).click();
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Demo'), exact: true }).click();
    const breakdown = page.getByTestId('form-validation-breakdown');
    await expect.poll(() => breakdown.textContent()).toMatch(/10/);
    const email = page.getByRole('textbox', { name: labels['email.label'], exact: true }).first();
    await expect.poll(() => email.inputValue()).toBe('not-an-email');
    await expect.poll(() => email.getAttribute('aria-invalid')).toBe('true');
    await email.fill('grace@example.com');
    await email.blur();
    await expect.poll(() => email.getAttribute('aria-invalid')).toBe('false');
    await expect.poll(() => breakdown.textContent()).toMatch(/9/);

    const phone = page.getByRole('textbox', { name: labels['phone.label'], exact: true });
    await expect.poll(() => phone.getAttribute('aria-invalid')).toBe('true');
    await phone.fill('+442079460123');
    await phone.blur();
    await expect.poll(() => phone.getAttribute('aria-invalid')).toBe('false');
    await expect.poll(() => breakdown.textContent()).toMatch(/8/);

    const otp =
      family === 'shadcn'
        ? page.locator('[data-pin-input-input]:visible')
        : page.getByRole('group', { name: labels['otp.label'], exact: true }).locator('input');
    await otp.first().focus();
    await otp.first().evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', '123456');
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await expect.poll(() => breakdown.textContent()).toMatch(/7/);

    await page.getByText(labels['contactTab.label'], { exact: true }).first().click();
    const city = page.getByRole('textbox', { name: labels['address.city.label'], exact: true });
    await expect.poll(() => city.getAttribute('aria-invalid')).toBe('true');
    await city.fill('London');
    await city.blur();
    await expect.poll(() => city.getAttribute('aria-invalid')).toBe('false');
    await expect.poll(() => breakdown.textContent()).toMatch(/6/);

    if (family === 'skeleton')
      await page
        .locator('button:visible')
        .filter({ hasText: labels['jobStep.label'] })
        .first()
        .click();
    else await page.getByText(labels['jobStep.label'], { exact: true }).first().click();
    const age = page.getByRole('spinbutton', { name: labels['age.label'], exact: true });
    await expect.poll(() => age.getAttribute('aria-invalid')).toBe('true');
    await age.fill('21');
    await age.blur();
    await expect.poll(() => age.getAttribute('aria-invalid')).toBe('false');
    await expect.poll(() => breakdown.textContent()).toMatch(/5/);
    const budget = page.getByRole('spinbutton', { name: labels['budget.label'], exact: true });
    await expect.poll(() => budget.getAttribute('aria-invalid')).toBe('true');
    await budget.fill('100');
    await budget.blur();
    await expect.poll(() => budget.getAttribute('aria-invalid')).toBe('false');
    await expect.poll(() => breakdown.textContent()).toMatch(/4/);

    await page.getByText(labels['schedule.label'], { exact: true }).first().click();
    const startDate = page.getByRole('textbox', { name: labels['startDate.label'], exact: true });
    await expect.poll(() => startDate.getAttribute('aria-invalid')).toBe('true');
    const dateFormat = (await startDate.getAttribute('placeholder'))!;
    await startDate.fill(
      dateFormat.replace('YYYY', '2026').replace('MM', '10').replace('DD', '01'),
    );
    await startDate.blur();
    await expect.poll(() => startDate.getAttribute('aria-invalid')).toBe('false');
    await expect.poll(() => breakdown.textContent()).toMatch(/3/);

    await page.getByText(labels['collections.label'], { exact: true }).first().click();
    const company = page.getByRole('textbox', {
      name: labels['experience.company.label'],
      exact: true,
    });
    if (!(await company.isVisible()))
      await page
        .locator('[data-list-navigation]:visible')
        .first()
        .locator('[role="option"], button[aria-current]')
        .first()
        .click();
    await expect.poll(() => company.getAttribute('aria-invalid')).toBe('true');
    await company.fill('Example Company');
    await company.blur();
    await expect.poll(() => company.getAttribute('aria-invalid')).toBe('false');
    await expect.poll(() => breakdown.textContent()).toMatch(/2/);

    if (family === 'skeleton')
      await page
        .locator('button:visible')
        .filter({ hasText: labels['referencesStep.label'] })
        .first()
        .click();
    else await page.getByText(labels['referencesStep.label'], { exact: true }).first().click();
    const tableLabel = labels['teamTab.label'];
    await page.getByText(tableLabel, { exact: true }).first().click();
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    const tableEmail = page.locator('table:visible tbody tr').nth(1).getByRole('textbox').nth(1);
    await expect.poll(() => tableEmail.inputValue()).toBe('broken');
    await expect.poll(() => tableEmail.getAttribute('aria-invalid')).toBe('true');
    await tableEmail.fill('colleague5@example.com');
    await tableEmail.blur();
    await expect.poll(() => tableEmail.getAttribute('aria-invalid')).toBe('false');
    await expect.poll(() => breakdown.textContent()).toMatch(/1/);

    await page.getByText(labels['gridTeamTab.label'], { exact: true }).first().click();
    const grid = page.locator('.jsonforms-ag-grid:visible');
    await grid.locator('.ag-paging-button[data-ref="btNext"]').click();
    const gridPhone = grid.locator('.ag-row[row-index="4"] .ag-cell[col-id="phone"] input');
    await expect.poll(() => gridPhone.inputValue()).toBe('broken');
    await expect.poll(() => gridPhone.getAttribute('aria-invalid')).toBe('true');
    await grid
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '5'),
        exact: true,
      })
      .first()
      .click();
    const rowDialog = page.getByRole('dialog');
    const detailPhone = rowDialog.getByRole('textbox', {
      name: labels['gridTeam.phone.label'],
      exact: true,
    });
    await expect.poll(() => detailPhone.inputValue()).toBe('broken');
    await detailPhone.fill('+442079460104');
    await rowDialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    await editor.click({ position: { x: 80, y: 20 } });
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    expect(
      JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).gridTeam[4].phone,
    ).toBe('+442079460104');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Demo'), exact: true }).click();
    await expect.poll(() => breakdown.count()).toBe(0);

    expect(errors).toEqual([]);
  },
  { timeout: 60_000 },
);
