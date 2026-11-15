import { createRendererAjv } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema } from '@jsonforms/core';
import { cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

const schema = {
  type: 'object',
  definitions: {
    Branch: {
      if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
      then: { properties: { vat: { type: 'string' } } },
      else: { properties: { nickname: { type: 'string' } } },
    },
    Profile: {
      type: 'object',
      properties: { kind: { type: 'string' } },
      allOf: [{ $ref: '#/definitions/Branch' }],
    },
  },
  properties: { value: { $ref: '#/definitions/Profile' } },
} as JsonSchema;

it.each([false, true])(
  'projects a %s external referenced conditional in NoValidation and retains inactive data',
  async (external) => {
    const ajv = external ? createRendererAjv() : undefined;
    if (ajv)
      ajv.addSchema({ $id: 'https://example.test/common.json', definitions: schema.definitions });
    const { view, onchange } = await mountForm({
      schema: external
        ? ({
            $id: 'https://example.test/root.json',
            type: 'object',
            properties: {
              value: { $ref: 'https://example.test/common.json#/definitions/Profile' },
            },
          } as JsonSchema)
        : schema,
      ajv,
      data: { value: { kind: 'business', vat: 'BG123', nickname: 'kept' } },
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { conditionalFields: true },
      },
      renderers: flowbiteRenderers,
      validationMode: 'NoValidation',
    });
    const values = () =>
      Array.from(view.container.querySelectorAll<HTMLInputElement>('input[type="text"]')).map(
        (input) => input.value,
      );
    await vi.waitFor(() => expect(values()).toContain('BG123'));
    expect(values()).not.toContain('kept');
    await page.getByRole('textbox').nth(1).fill('BG456');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        value: { kind: 'business', vat: 'BG456', nickname: 'kept' },
      }),
    );
    await view.rerender({ data: { value: { kind: 'personal', vat: 'BG456', nickname: 'kept' } } });
    await vi.waitFor(() => expect(values()).toContain('kept'));
    expect(values()).not.toContain('BG456');
  },
);
