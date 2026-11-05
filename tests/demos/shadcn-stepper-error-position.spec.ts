import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/categorization/translations.json';

demoTest(
  'shadcn-stepper-error-position',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.setViewportSize({ width: 1440, height: 720 });
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const labels = translations[locale];
    await page
      .locator('[data-slot="tabs-trigger"]')
      .filter({ hasText: labels['featureNavigation.section2.label'] })
      .first()
      .click();
    const nav = page.locator('[data-slot="stepper-nav"]').first();
    const marker = nav
      .locator('[data-slot="stepper-trigger"]')
      .filter({ hasText: labels['category.planning.label'] })
      .locator('[data-container-validation-indicator]');
    await marker.hover();
    const popup = page.getByRole('dialog', {
      name: (await marker.getAttribute('aria-label')) ?? undefined,
    });
    await popup.waitFor();
    await expect
      .poll(async () => {
        const icon = await marker.boundingBox();
        const content = await popup.boundingBox();
        if (!icon || !content) return null;
        return {
          above: content.y + content.height <= icon.y,
          gap: Math.round(icon.y - (content.y + content.height)),
        };
      })
      .toEqual({ above: true, gap: 4 });
  },
  { families: ['shadcn'] },
);
