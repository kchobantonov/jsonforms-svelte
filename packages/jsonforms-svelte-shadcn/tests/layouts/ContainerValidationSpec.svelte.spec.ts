import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { createSpecContainerValidationIndicatorExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-container-validation-indicator';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-container-validation-indicator/translations.json';
import supplement from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-container-validation-indicator/translations.supplement.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'corrects the canonical collapsed section in %s without changing siblings',
  async (locale) => {
    const example = createSpecContainerValidationIndicatorExample(() => locale);
    const onchange = vi.fn();
    await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const group = page.getByRole('button', {
      name: translations[locale]['emergencyContact.label'],
      exact: true,
    });
    await expect.element(group).toHaveAttribute('aria-expanded', 'false');
    expect(
      group
        .element()
        .querySelector('[data-container-validation-indicator]')
        ?.getAttribute('aria-label'),
    ).toBe(translations[locale]['validation.containerHasErrors']);
    await group.click();
    await expect.element(group).toHaveAttribute('aria-expanded', 'true');
    await page
      .getByRole('textbox', {
        name: supplement[locale][
          'specContainerValidation.schema.properties.emergencyContact.properties.phone.label'
        ],
        exact: false,
      })
      .fill('+359 2 000 0000');
    await vi.waitFor(() =>
      expect(group.element().querySelector('[data-container-validation-indicator]')).toBeNull(),
    );
    const expected = structuredClone(example.data) as { emergencyContact: { phone: string } };
    expected.emergencyContact.phone = '+359 2 000 0000';
    expect(onchange.mock.lastCall?.[0].data).toEqual(expected);
    await group.click();
    await expect.element(group).toHaveAttribute('aria-expanded', 'false');
    expect(
      group.element().querySelector('[data-group-indicator]')?.getAttribute('aria-label'),
    ).toBe(translations[locale]['group.dataIndicator']);
  },
);
