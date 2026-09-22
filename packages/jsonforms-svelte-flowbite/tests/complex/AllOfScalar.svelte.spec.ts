import type { Translator } from '@jsonforms/core';
import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { mountForm, waitForFormChange } from '../testUtils';
import { flowbiteRenderers } from '../../src/lib/renderers';
afterEach(cleanup);
it('preserves the outer label for the meta-schema annotation-only allOf', async () => {
  const { view, onchange } = mountForm({
    renderers: flowbiteRenderers,
    schema: {
      type: 'object',
      definitions: {
        nonNegativeInteger: { type: 'integer', minimum: 0 },
        nonNegativeIntegerDefault0: {
          allOf: [{ $ref: '#/definitions/nonNegativeInteger' }, { default: 0 }],
        },
      },
      properties: { minLength: { $ref: '#/definitions/nonNegativeIntegerDefault0' } },
    },
    uischema: { type: 'Control', scope: '#/properties/minLength' },
    data: { minLength: 123 },
  });
  await tick();
  const inputs = view.container.querySelectorAll<HTMLInputElement>('input');
  expect(inputs).toHaveLength(1);
  expect(view.container.textContent).toContain('Min Length');
  expect(inputs[0].value).toBe('123');
  expect(inputs[0].min).toBe('0');
  await view.rerender({ data: { minLength: -1 } });
  await tick();
  expect(
    onchange.mock.lastCall?.[0].errors.some((e: { keyword: string }) => e.keyword === 'minimum'),
  ).toBe(true);
});

it('retains outer UI options, translations and the nested data path', async () => {
  const { view, onchange } = mountForm({
    renderers: flowbiteRenderers,
    schema: {
      type: 'object',
      properties: {
        settings: {
          type: 'object',
          properties: {
            count: { allOf: [{ type: 'integer', minimum: 0 }, { default: 0 }] },
          },
        },
      },
    },
    uischema: {
      type: 'Control',
      scope: '#/properties/settings/properties/count',
      label: 'Custom count',
      i18n: 'settings.count',
      options: { readonly: true },
    } as any,
    data: { settings: { count: 4 }, untouched: 'keep' },
  });
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: ((key: string, fallback?: string) =>
        key === 'settings.count.label' ? 'Translated count' : fallback) as Translator,
    },
  });
  await tick();
  expect(view.container.textContent).toContain('Translated count');
  let input = view.container.querySelector<HTMLInputElement>('input')!;
  expect(input.disabled || input.readOnly).toBe(true);
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: ((_key: string, fallback?: string) => fallback) as Translator,
    },
    uischema: {
      type: 'Control',
      scope: '#/properties/settings/properties/count',
      label: 'Custom count',
    },
  });
  await tick();
  expect(view.container.textContent).toContain('Custom count');
  input = view.container.querySelector<HTMLInputElement>('input')!;
  const before = onchange.mock.calls.length;
  input.value = '9';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  expect((await waitForFormChange(onchange, before)).data).toEqual({
    settings: { count: 9 },
    untouched: 'keep',
  });
});
