import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/categorization/translations.json';

demoTest(
  'shadcn-tabs-active-style',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const list = page
      .locator('[data-slot="tabs-list"][data-variant="default"]')
      .filter({ hasText: translations[locale]['featureNavigation.section2.label'] })
      .first();
    const first = list
      .locator('[data-slot="tabs-trigger"]')
      .filter({ hasText: translations[locale]['featureNavigation.section1.label'] });
    const second = list
      .locator('[data-slot="tabs-trigger"]')
      .filter({ hasText: translations[locale]['featureNavigation.section2.label'] });

    await second.click();
    await expect.poll(() => second.getAttribute('data-state')).toBe('active');
    await expect.poll(() => first.getAttribute('data-state')).toBe('inactive');
    await expect
      .poll(() => second.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe('rgba(0, 0, 0, 0)');
    await expect
      .poll(() => first.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgba(0, 0, 0, 0)');
  },
  { families: ['shadcn'] },
);
