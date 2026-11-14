import type { JsonSchema } from '@jsonforms/core';
import { cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

const schema = {
  $id: 'https://example.test/root.json',
  type: 'object',
  definitions: {
    Branch: {
      if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
      then: { properties: { vat: { type: 'string' } } },
      else: { properties: { nickname: { type: 'string' } } },
    },
    Node: {
      type: 'object',
      properties: { kind: { type: 'string' }, child: { $ref: '#/definitions/Node' } },
      allOf: [{ $ref: '#/definitions/Branch' }],
    },
  },
  properties: { value: { $ref: '#/definitions/Node' } },
} as JsonSchema;

it('projects each recursive occurrence by its own data without creating another child', async () => {
  const data = {
    value: {
      kind: 'business',
      vat: 'Parent VAT',
      nickname: 'parent hidden',
      child: { kind: 'personal', nickname: 'Child nick', vat: 'child hidden' },
    },
  };
  const { view, onchange } = await mountForm({
    schema,
    data,
    uischema: { type: 'Control', scope: '#/properties/value' },
    config: { jsonformsExtended: { conditionalFields: true } },
    renderers: skeletonRenderers,
    validationMode: 'NoValidation',
  });
  const values = () =>
    Array.from(view.container.querySelectorAll<HTMLInputElement>('input[type="text"]')).map(
      (input) => input.value,
    );
  await vi.waitFor(() => expect(values()).toContain('Parent VAT'));
  expect(values()).toContain('Child nick');
  expect(values()).not.toContain('parent hidden');
  expect(values()).not.toContain('child hidden');
  const index = values().indexOf('Child nick');
  await page.getByRole('textbox').nth(index).fill('Edited child');
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      value: {
        kind: 'business',
        vat: 'Parent VAT',
        nickname: 'parent hidden',
        child: { kind: 'personal', nickname: 'Edited child', vat: 'child hidden' },
      },
    }),
  );
  expect(view.container.querySelectorAll('input[type="text"]')).toHaveLength(4);
});
