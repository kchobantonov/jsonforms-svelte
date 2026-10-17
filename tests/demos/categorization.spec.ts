import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('categorization', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section3.label'],
      exact: false,
    })
    .click();
  const planning = page.getByRole('button', {
    name: translations[locale]['category.planning.label'],
    exact: false,
  });
  await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('true');
  const marker = planning.locator('[data-container-validation-indicator]');
  expect(await marker.getAttribute('aria-label')).toBe(
    messages[locale]['validation.containerHasErrors'],
  );
  await marker.click();
  const tooltip = page.getByRole('tooltip');
  await expect.poll(() => tooltip.isVisible()).toBe(true);
  expect(await tooltip.textContent()).toContain(messages[locale]['validation.containerHasErrors']);
  expect(await planning.getAttribute('aria-expanded')).toBe('true');
  await page.keyboard.press('Escape');
  await expect.poll(() => tooltip.isVisible()).toBe(false);
  await page
    .getByRole('spinbutton', {
      name: supplement[locale]['specCategorization.schema.properties.itemCount.label'],
      exact: true,
    })
    .fill('4');
  await expect.poll(() => marker.count()).toBe(0);
  await planning.click();
  await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('false');
  const contact = page.getByRole('button', {
    name: translations[locale]['category.contact.label'],
    exact: false,
  });
  await contact.click();
  await expect.poll(() => contact.getAttribute('aria-expanded')).toBe('true');
  expect(await planning.getAttribute('aria-expanded')).toBe('false');
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section2.label'],
      exact: false,
    })
    .click();
  const next = page.getByRole('button', {
    name: translations[locale]['categorization.next'],
    exact: false,
  });
  await next.click();
  const previous = page.getByRole('button', {
    name: translations[locale]['categorization.previous'],
    exact: false,
  });
  await expect.poll(() => previous.isEnabled()).toBe(true);
  expect(errors).toEqual([]);
});
