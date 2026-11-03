import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-numeric-controls/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-numeric-controls/translations.supplement.json';

demoTest(
  'slider value tooltip host overlay',
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
      `${base}/${family}/#/examples/spec-numeric-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();
    const slider = page.getByRole('slider', {
      name: supplement[locale]['specNumericControls.schema.properties.discountPercent.label'],
      exact: true,
    });
    await slider.focus();
    const tooltip =
      family === 'flowbite'
        ? page.locator('[role="tooltip"]:visible').first()
        : page.locator('[data-slot="slider-value-tooltip"]:visible').first();
    await tooltip.waitFor();
    expect(await tooltip.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await tooltip.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
  },
);
