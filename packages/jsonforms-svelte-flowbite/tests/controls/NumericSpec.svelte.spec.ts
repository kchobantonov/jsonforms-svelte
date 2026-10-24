import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteCells, flowbiteRenderers } from '../../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createSpecNumericControlsExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-numeric-controls';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-numeric-controls/translations.json';
import supplement from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-numeric-controls/translations.supplement.json';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'keeps canonical numeric values and unsupported integer drafts in %s',
  async (locale) => {
    const example = createSpecNumericControlsExample(() => locale);
    const onchange = vi.fn();
    await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
        onchange,
      },
    });
    const quantity = page.getByRole('spinbutton', {
      name: supplement[locale]['specNumericControls.schema.properties.quantity.label'],
      exact: true,
    });
    await expect.element(quantity).toHaveValue(0);
    await quantity.fill('1.9');
    await expect
      .element(page.getByText(messages[locale]['numeric.integer'], { exact: true }))
      .toBeVisible();
    expect(onchange.mock.lastCall?.[0].data.quantity).toBe(0);
    expect(onchange.mock.lastCall?.[0].data.batchCount).toBe(3);
    await quantity.fill('1e3');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.quantity).toBe(1000));
    const tab = (section: 1 | 2 | 3) =>
      (
        page
          .getByRole('tab', {
            name: translations[locale][`featureNavigation.section${section}.label`],
            exact: true,
          })
          .element() as HTMLElement
      ).click();
    tab(2);
    const weight = page.getByRole('spinbutton', {
      name: supplement[locale]['specNumericControls.schema.properties.weightKg.label'],
      exact: true,
    });
    await expect.element(weight).toHaveValue(0);
    const tolerance = page.getByRole('spinbutton', {
      name: supplement[locale]['specNumericControls.schema.properties.toleranceMm.label'],
      exact: true,
    });
    await expect.element(tolerance).toHaveValue(-2.5);
    await weight.fill('1.25');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.weightKg).toBe(1.25));
    tab(3);
    await expect.element(page.getByRole('slider')).toHaveValue('0');
    expect(onchange.mock.lastCall?.[0].data.discountPercent).toBe(0);
    tab(1);
    await expect.element(quantity).toHaveValue(1000);
  },
);
