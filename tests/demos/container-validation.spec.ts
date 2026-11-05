import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/translations.json';

demoTest('container-validation', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-container-validation-indicator?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const group = page.getByRole('button', {
    name: translations[locale]['emergencyContact.label'],
    exact: true,
  });
  const groupFrame = page.getByRole('group', {
    name: translations[locale]['emergencyContact.label'],
    exact: true,
  });
  await expect.poll(() => groupFrame.count()).toBe(1);
  await expect.poll(() => group.getAttribute('aria-expanded')).toBe('false');
  const step = (key: 'personalDetails.label' | 'compliance.label') =>
    page
      .getByRole('tab', { name: translations[locale][key], exact: false })
      .or(page.getByRole('button', { name: translations[locale][key], exact: false }))
      .first();
  const personal = step('personalDetails.label');
  const compliance = step('compliance.label');
  if (family === 'flowbite') {
    expect(await personal.innerText()).toContain(
      translations[locale]['validation.containerHasErrors'],
    );
    expect(await compliance.innerText()).toContain(
      translations[locale]['validation.containerHasErrors'],
    );
  } else {
    await expect
      .poll(() => personal.locator('[data-container-validation-indicator]').count())
      .toBe(1);
    await expect
      .poll(() => compliance.locator('[data-container-validation-indicator]').count())
      .toBe(1);
    const categoryIndicator = personal.locator('[data-container-validation-indicator]');
    await categoryIndicator.focus();
    await page.keyboard.press('Enter');
    const categorySummary = page.locator('[data-error-summary]:visible');
    await expect.poll(() => categorySummary.isVisible()).toBe(true);
    const categoryPopup = categorySummary.locator('xpath=ancestor::*[@role="dialog"][1]');
    expect(
      await categoryPopup.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    ).toBe(webcomponent);
    expect(
      await categoryPopup.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Escape');
    await expect.poll(() => categorySummary.count()).toBe(0);
    await expect
      .poll(() => categoryIndicator.evaluate((element) => element.matches(':focus')))
      .toBe(true);
  }
  await compliance.click();
  await expect.poll(() => page.locator('[data-array-summary]:visible').count()).toBe(0);
  await personal.click();
  if (family === 'skeleton') {
    const geometry = await group.evaluate((node) => {
      const button = node.getBoundingClientRect();
      const card = node.closest('section')!.getBoundingClientRect();
      const title = node.firstElementChild!.getBoundingClientRect();
      return {
        coverage: button.width / card.width,
        titleOffset: (title.left - button.left) / button.width,
      };
    });
    expect(geometry.coverage).toBeGreaterThan(0.9);
    expect(geometry.titleOffset).toBeLessThan(0.1);
  }
  const marker = group.locator('[data-container-validation-indicator]');
  expect(await marker.getAttribute('aria-label')).toBe(
    translations[locale]['validation.containerHasErrors'],
  );
  await marker.focus();
  await page.keyboard.press('Enter');
  const summary = page.locator('[data-error-summary]:visible');
  await expect.poll(() => summary.isVisible()).toBe(true);
  const popup = summary.locator('xpath=ancestor::*[@role="dialog"][1]');
  await expect.poll(() => popup.count()).toBe(1);
  expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
    webcomponent,
  );
  expect(await popup.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
  );
  expect(await group.getAttribute('aria-expanded')).toBe('false');
  await page.keyboard.press('Escape');
  await expect.poll(() => summary.count()).toBe(0);
  await expect.poll(() => marker.evaluate((element) => element.matches(':focus'))).toBe(true);
  await group.click();
  const phone = page.getByRole('textbox', {
    name: supplement[locale][
      'specContainerValidation.schema.properties.emergencyContact.properties.phone.label'
    ],
    exact: false,
  });
  await phone.fill('+359 2 000 0000');
  await expect.poll(() => marker.count(), { timeout: 5_000 }).toBe(0);
  await group.click();
  await expect.poll(() => group.getAttribute('aria-expanded')).toBe('false');
  expect(await group.locator('[data-group-indicator]').getAttribute('aria-label')).toBe(
    translations[locale]['group.dataIndicator'],
  );
  await group.click();
  expect(await phone.inputValue()).toBe('+359 2 000 0000');
  expect(errors).toEqual([]);
});
