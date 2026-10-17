import '../../jsonforms-svelte-flowbite/tests/test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import type { JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers, flowbiteCells } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedRenderers } from '../src/lib';
import { createSpecAdditionalErrorsExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-errors';
import translations from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-errors/translations.json';
import fields from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-errors/translations.supplement.json';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'publishes the canonical editor summary while preserving a server error in %s',
  async (locale) => {
    const example = createSpecAdditionalErrorsExample(() => locale);
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const hostError = {
      keyword: 'server',
      instancePath: '/policy',
      schemaPath: '',
      params: {},
      message: 'Host error',
    };
    const view = render(JsonForms, {
      props: {
        schema: example.schema!,
        uischema: example.uischema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: [...flowbiteExtendedRenderers, ...flowbiteRenderers],
        cells: flowbiteCells,
        additionalErrors: [hostError],
        onvaliditychange: validity,
      },
    });
    await page
      .getByRole('tab', { name: translations[locale]['reportedTab.label'], exact: true })
      .click();
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toHaveLength(2), {
      timeout: 10000,
    });
    expect(validity.mock.lastCall?.[0].additionalErrors).toContainEqual(hostError);
    expect(
      validity.mock.lastCall?.[0].additionalErrors.filter((error) => error.keyword === 'editor'),
    ).toHaveLength(1);
    const input = page.getByRole('textbox', {
      name: fields[locale]['specAdditionalErrors.schema.properties.policy.label'],
      exact: true,
    });
    (input.element() as HTMLElement).focus();
    const modifier = navigator.platform.includes('Mac') ? 'Meta' : 'Control';
    await userEvent.keyboard(`{${modifier}>}a{/${modifier}}{Backspace}`);
    await userEvent.keyboard('true');
    await vi.waitFor(() =>
      expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([hostError]),
    );
    await view.rerender({ additionalErrors: [] });
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(true));
    await page
      .getByRole('tab', { name: translations[locale]['quietTab.label'], exact: true })
      .click();
    await expect
      .element(
        page.getByRole('tabpanel', {
          name: translations[locale]['quietTab.label'],
          exact: true,
        }),
      )
      .toBeVisible();
    await vi.waitFor(() =>
      expect(
        page
          .getByRole('textbox', {
            name: fields[locale]['specAdditionalErrors.schema.properties.quiet.label'],
            exact: true,
          })
          .query(),
      ).not.toBeNull(),
    );
    expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([]);
  },
);
