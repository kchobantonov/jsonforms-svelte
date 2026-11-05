import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import mixedLabels from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/translations.json';

demoTest(
  'demo namespaced session setting does not mask the next example',
  async ({ page, family, webcomponent, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.getByRole('button', { name: messages.en['nav.openSettings'] }).click();
    await page.getByText(messages.en['settings.collapseInitially'], { exact: true }).click();
    await page.getByRole('button', { name: messages.en['nav.closeSettings'] }).last().click();

    await page.evaluate((host) => {
      location.hash = `#/examples/spec-mixed-control?use-webcomponent=${host}&drawer=false`;
    }, webcomponent);
    await page
      .getByRole('tab', {
        name: mixedLabels.en['mixedComposition.navigation.label'],
        exact: true,
      })
      .click();
    const composedObject = page.getByRole('button', {
      name: mixedLabels.en['mixedComposition.composedObject.label'],
      exact: true,
    });
    await expect.poll(() => composedObject.getAttribute('aria-expanded')).toBe('false');
    expect(errors).toEqual([]);
  },
  { locales: ['en'], timeout: 30_000 },
);
