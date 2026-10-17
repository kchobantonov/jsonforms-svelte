import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-template-slots/translations.supplement.json';

demoTest('template-slots', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-template-slots?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const custom = page.getByRole('textbox', {
    name: fields[locale]['specTemplateSlots.ui.elements.1.elements.1.label'],
    exact: true,
  });
  const fallback = page.getByRole('textbox', {
    name: fields[locale]['specTemplateSlots.registry.0.elements.1.elements.0.label'],
    exact: true,
  });
  await expect.poll(() => custom.inputValue()).toBe('Ada');
  await custom.fill('Updated contact');
  await custom.blur();
  await expect.poll(() => fallback.inputValue()).toBe('Updated contact');
  const email = page.getByRole('textbox', {
    name: fields[locale]['specTemplateSlots.ui.elements.3.elements.1.label'],
    exact: true,
  });
  await email.fill('updated@example.org');
  await email.blur();
  await expect.poll(() => email.inputValue()).toBe('updated@example.org');
  await expect
    .poll(() =>
      page
        .getByText(fields[locale]['specTemplateSlots.registry.1.elements.0.elements.0.text'], {
          exact: true,
        })
        .isVisible(),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
