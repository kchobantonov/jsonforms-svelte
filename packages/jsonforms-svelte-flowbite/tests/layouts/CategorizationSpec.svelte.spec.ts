import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createSpecCategorizationExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-categorization';
import supplement from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/translations.supplement.json';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/translations.json';
afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'uses the native accordion for the canonical %s example',
  async (locale) => {
    const example = createSpecCategorizationExample(() => locale);
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
    const tab = page.getByRole('tab', {
      name: translations[locale]['featureNavigation.section3.label'],
      exact: false,
    });
    await tab.click();
    const planning = page.getByRole('button', {
      name: translations[locale]['category.planning.label'],
      exact: false,
    });
    await expect.element(planning).toHaveAttribute('aria-expanded', 'true');
    expect(
      page
        .getByRole('button', {
          name: translations[locale]['category.business.label'],
          exact: false,
        })
        .query(),
    ).toBeNull();
    expect(
      planning
        .element()
        .querySelector('[data-container-validation-indicator]')
        ?.getAttribute('aria-label'),
    ).toBe(messages[locale]['validation.containerHasErrors']);
    expect(
      planning.element().querySelector('[data-group-indicator]')?.getAttribute('aria-label'),
    ).toBe(translations[locale]['group.dataIndicator']);
    await page
      .getByRole('spinbutton', {
        name: supplement[locale]['specCategorization.schema.properties.itemCount.label'],
        exact: true,
      })
      .fill('4');
    await vi.waitFor(() =>
      expect(planning.element().querySelector('[data-container-validation-indicator]')).toBeNull(),
    );
    const before = structuredClone(onchange.mock.lastCall?.[0].data);
    await planning.click();
    await expect.element(planning).toHaveAttribute('aria-expanded', 'false');
    await page
      .getByRole('button', { name: translations[locale]['category.contact.label'], exact: false })
      .click();
    await expect.element(planning).toHaveAttribute('aria-expanded', 'false');
    expect(onchange.mock.lastCall?.[0].data).toEqual(before);
  },
);
