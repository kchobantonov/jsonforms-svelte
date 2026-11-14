import type { JsonSchema } from '@jsonforms/core';
import { cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

it.each(['en', 'bg'])(
  'diagnoses unsupported dynamic rendering in %s without changing data',
  async (locale) => {
    const data = { value: { label: 'Leaf' } };
    const { view, onchange } = await mountForm({
      schema: {
        $id: 'https://example.test/node.json',
        $dynamicAnchor: 'node',
        type: 'object',
        properties: { value: { $dynamicRef: '#node' } },
      } as JsonSchema,
      data,
      uischema: { type: 'Control', scope: '#/properties/value' },
      renderers: skeletonRenderers,
      validationMode: 'NoValidation',
      i18n: { locale },
    });
    const alert = view.container.querySelector('[data-schema-reference-error]');
    expect(alert?.textContent).toContain('#node');
    expect(alert?.textContent).toContain(locale === 'bg' ? 'Динамичната' : 'Dynamic');
    expect(view.container.querySelector('input')).toBeNull();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
    const validity = vi.fn();
    await view.rerender({ onvaliditychange: validity });
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(false));
    expect(validity.mock.lastCall?.[0].current).toBe(false);
    expect(validity.mock.lastCall?.[0].additionalErrors[0]?.keyword).toBe('$dynamicRef');
    await view.rerender({
      schema: {
        type: 'object',
        properties: { value: { type: 'object', properties: { label: { type: 'string' } } } },
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-schema-reference-error]')).toBeNull(),
    );
    await page.getByRole('textbox').fill('Edited');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { label: 'Edited' } }),
    );
  },
);
