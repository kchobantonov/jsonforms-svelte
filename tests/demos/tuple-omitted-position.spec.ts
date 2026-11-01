import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import data from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/data.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'tuple omitted-position feedback',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-tuple-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/orderLine',
          options: {
            detail: {
              type: 'VerticalLayout',
              elements: [{ type: 'Control', scope: '#/items/0' }],
            },
          },
        },
      ],
    });
    await applyDemoEditor(
      page,
      locale,
      'Data',
      { ...data, orderLine: ['PART-01', 0] },
      { verifyVisibleText: false },
    );
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();

    const tuple = page.locator('[data-tuple-control]');
    const omitted = tuple.locator('[data-tuple-omitted-errors]');
    await expect.poll(() => omitted.count()).toBe(1);
    await expect
      .poll(() => omitted.getAttribute('aria-label'))
      .toBe(messages[locale]['tuple.omittedErrors']);
    const quantity = supplement[locale]['tupleExample.schema.properties.orderLine.items.1.label'];
    await expect.poll(() => omitted.textContent()).toContain(quantity);
    expect(await omitted.textContent()).not.toBe(quantity);
    expect(pageErrors).toEqual([]);
  },
);
