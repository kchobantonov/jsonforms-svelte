import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-container-validation-indicator/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-container-validation-indicator/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'container-validation-composite-cells',
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
      `${base}/${family}/#/examples/spec-container-validation-indicator?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const label = translations[locale]['compositeCells.label'];
    await page
      .getByRole('tab', { name: label, exact: false })
      .or(page.getByRole('button', { name: label, exact: false }))
      .first()
      .click();
    const table = page.getByRole('table').first();
    await expect.poll(() => table.locator('tbody tr').count()).toBe(2);
    const invalid = table.locator('tbody tr').first();
    const valid = table.locator('tbody tr').last();
    await expect.poll(() => invalid.locator('[data-composite-cell]').count()).toBe(5);
    await expect.poll(() => valid.locator('[data-composite-cell]').count()).toBe(5);
    await expect.poll(() => invalid.locator('.cell-invalid > button[aria-label]').count()).toBe(5);
    await expect.poll(() => valid.locator('.cell-invalid > button[aria-label]').count()).toBe(0);
    const remove = invalid.locator('[data-composite-cell] .composite-clear').first();
    await expect.poll(() => remove.isEnabled()).toBe(true);
    await remove.focus();
    const removeHint = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({ hasText: messages[locale]['composite.remove'] })
      .first();
    await expect.poll(() => removeHint.isVisible()).toBe(true);
    expect(
      await removeHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    ).toBe(webcomponent);
    expect(
      await removeHint.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Escape');
    await expect.poll(() => removeHint.isVisible()).toBe(false);
    await expect.poll(() => remove.evaluate((element) => element.matches(':focus'))).toBe(true);
    const errorButtons = invalid.locator('.cell-invalid > button[aria-label]');
    expect(await errorButtons.nth(0).getAttribute('aria-label')).toContain(
      supplement[locale][
        'specContainerValidation.schema.properties.applicants.items.properties.contact.properties.city.label'
      ],
    );
    for (const key of ['company', 'role'] as const) {
      expect(await errorButtons.nth(1).getAttribute('aria-label')).toContain(
        supplement[locale][
          `specContainerValidation.schema.properties.applicants.items.properties.experience.items.properties.${key}.label`
        ],
      );
    }
    if (family === 'shadcn') {
      await errorButtons.first().hover();
      const tooltip = page.locator('[data-tooltip-content]:visible');
      await tooltip.waitFor();
      expect(await tooltip.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      await page.mouse.move(0, 0);
    }
    const cells = invalid.locator('[data-composite-cell]');
    const labels = [
      'contact',
      'experience',
      'oneOfContact',
      'anyOfContact',
      'allOfContact',
    ] as const;
    for (const [index, key] of labels.entries()) {
      await invalid.hover();
      await cells.nth(index).locator('button').first().click();
      const dialog = page.getByRole('dialog').first();
      await expect.poll(() => dialog.count()).toBe(1);
      expect(await dialog.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      await expect.poll(() => dialog.innerText()).not.toMatch(/No applicable renderer/);
      await expect
        .poll(() => dialog.innerText())
        .not.toContain(
          supplement[locale]['specContainerValidation.schema.properties.fullName.label'],
        );
      if (key === 'contact') {
        await expect
          .poll(() => dialog.innerText())
          .toContain(
            supplement[locale][
              'specContainerValidation.schema.properties.applicants.items.properties.contact.properties.city.label'
            ],
          );
      }
      await dialog
        .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
        .click();
      await expect.poll(() => dialog.count()).toBe(0);
    }
    expect(errors).toEqual([]);
  },
);
