import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createSpecNullControlExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-null-control';
import supplement from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-null-control/translations.supplement.json';
import './test.css';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'distinguishes null, absence, empty strings and invalid imports in %s',
  async (locale) => {
    const example = createSpecNullControlExample(() => locale);
    const onchange = vi.fn();
    await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: [...skeletonExtendedCells, ...skeletonCells],
        onchange,
      },
    });
    const surcharge = page.getByRole('checkbox', {
      name: supplement[locale]['specNullControl.schema.properties.noSurcharge.label'],
      exact: true,
    });
    await expect.element(surcharge).toBeChecked();
    const required = page.getByRole('checkbox', {
      name: supplement[locale]['specNullControl.schema.properties.exceptionsChecked.label'],
      exact: true,
    });
    await required.click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.exceptionsChecked).toBeNull());
    expect(onchange.mock.lastCall?.[0].data.legacyApproval).toBe('n/a');
    expect(onchange.mock.lastCall?.[0].data.reviewNote).toBe('');
    expect(Object.hasOwn(onchange.mock.lastCall?.[0].data, 'referenceNumber')).toBe(false);
    await surcharge.click();
    await vi.waitFor(() =>
      expect(Object.hasOwn(onchange.mock.lastCall?.[0].data ?? {}, 'noSurcharge')).toBe(false),
    );
    const legacy = page.getByRole('checkbox', {
      name: supplement[locale]['specNullControl.schema.properties.legacyApproval.label'],
      exact: true,
    });
    await legacy.click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.legacyApproval).toBeNull());
    expect(onchange.mock.lastCall?.[0].data.inspectionRemark).toBeNull();
  },
);
