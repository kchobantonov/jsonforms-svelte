import '../test.css';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { mountForm, waitForFormChange } from '../testUtils';

afterEach(cleanup);

const uischema = (options: Record<string, unknown> = {}): UISchemaElement => ({
  type: 'Control',
  scope: '#/properties/value',
  options,
});
const schema = (additionalProperties?: boolean): JsonSchema => ({
  type: 'object',
  properties: {
    value: {
      type: 'object',
      properties: { fixed: { type: 'string' } },
      ...(additionalProperties === undefined ? {} : { additionalProperties }),
    },
  },
});
const addButton = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
    button.getAttribute('aria-label')?.includes('Add'),
  );

it.each([
  { config: {}, options: {}, additionalProperties: undefined, visible: false },
  {
    config: { allowAdditionalPropertiesIfMissing: true },
    options: {},
    additionalProperties: undefined,
    visible: true,
  },
  {
    config: { allowAdditionalPropertiesIfMissing: true },
    options: { allowAdditionalPropertiesIfMissing: false },
    additionalProperties: undefined,
    visible: false,
  },
  {
    config: { allowAdditionalPropertiesIfMissing: false },
    options: { allowAdditionalPropertiesIfMissing: true },
    additionalProperties: undefined,
    visible: true,
  },
  {
    config: { jsonformsExtended: { allowAdditionalPropertiesIfMissing: true } },
    options: {},
    additionalProperties: undefined,
    visible: false,
  },
  {
    config: { allowAdditionalPropertiesIfMissing: true },
    options: {},
    additionalProperties: false,
    visible: false,
  },
  { config: {}, options: {}, additionalProperties: true, visible: true },
])(
  'applies the flat missing-additional-property gate and local precedence: $visible',
  async ({ config, options, additionalProperties, visible }) => {
    const { view } = await mountForm({
      schema: schema(additionalProperties),
      uischema: uischema(options),
      data: { value: { fixed: 'kept' } },
      config,
      renderers: flowbiteRenderers,
    });
    await vi.waitFor(() => expect(Boolean(addButton(view.container))).toBe(visible));
  },
);

it('adds a property through the flat missing-schema allowance without changing fixed data', async () => {
  const { view, onchange } = await mountForm({
    schema: schema(),
    uischema: uischema(),
    data: { value: { fixed: 'kept' } },
    config: { allowAdditionalPropertiesIfMissing: true },
    renderers: flowbiteRenderers,
  });
  const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
    (element) => element.value === '',
  );
  expect(input).toBeTruthy();
  input!.value = 'newKey';
  input!.dispatchEvent(new Event('input', { bubbles: true }));
  const add = addButton(view.container);
  await vi.waitFor(() => expect(add?.disabled).toBe(false));
  const before = onchange.mock.calls.length;
  add!.click();
  const changed = await waitForFormChange(onchange, before);
  expect(changed.data.value).toMatchObject({ fixed: 'kept', newKey: expect.anything() });
});
