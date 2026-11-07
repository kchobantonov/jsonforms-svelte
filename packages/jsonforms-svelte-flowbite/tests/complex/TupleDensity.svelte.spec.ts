import '../test.css';
import { type JsonSchema } from '@jsonforms/core';
import { afterEach, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup } from 'vitest-browser-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { mountControl, waitForChange } from '../testUtils';

afterEach(cleanup);

it('fills nullable and defaulted prefix positions densely before a tail add', async () => {
  const { onchange } = await mountControl({
    renderers: flowbiteRenderers,
    propertySchema: {
      type: 'array',
      items: [{ type: 'null' }, { type: 'integer', default: 4 }],
      additionalItems: { type: 'string', default: 'tail' },
    } as JsonSchema,
    value: [],
  });
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  const value = (await waitForChange(onchange, before)).data.value as unknown[];
  expect(value).toEqual([null, 4, 'tail']);
  expect(Object.keys(value)).toEqual(['0', '1', '2']);
});

it('refuses a tail add when a missing prefix has no unambiguous default', async () => {
  const { view, onchange } = await mountControl({
    renderers: flowbiteRenderers,
    propertySchema: {
      type: 'array',
      items: [{ enum: ['A', 'B'] }],
      additionalItems: { type: 'string' },
    } as JsonSchema,
    value: [],
  });
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  await expect.poll(() => view.container.textContent?.includes('Enter Item 1 first.')).toBe(true);
  expect(onchange.mock.calls.length).toBe(before);
});

it('replaces an imported null object position without changing adjacent values', async () => {
  const { onchange } = await mountControl({
    renderers: flowbiteRenderers,
    propertySchema: {
      type: 'array',
      items: [
        { type: 'string', title: 'Code' },
        {
          type: 'object',
          title: 'Address',
          properties: { street: { type: 'string', title: 'Street' } },
        },
      ],
      additionalItems: false,
    } as JsonSchema,
    value: ['keep', null],
  });
  await page.getByRole('button', { name: /Edit Address/ }).click();
  const input = page.getByRole('dialog').element().querySelector<HTMLInputElement>('input')!;
  input.value = 'Main Street';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([
    'keep',
    { street: 'Main Street' },
  ]);
});

it.each([
  {
    name: 'direct string',
    tail: { type: 'string', minLength: 3 },
    value: 'x',
  },
  {
    name: 'nested object',
    tail: {
      type: 'object',
      properties: { name: { type: 'string', minLength: 3 } },
    },
    value: { name: 'x' },
  },
])('shows $name validation at its tail occurrence', async ({ tail, value }) => {
  const { view } = await mountControl({
    renderers: flowbiteRenderers,
    propertySchema: {
      type: 'array',
      items: [{ type: 'string' }],
      additionalItems: tail,
    } as JsonSchema,
    value: ['fixed', value],
  });
  const occurrence = view.container.querySelector('[data-additional-item="1"]')!;
  await expect.poll(() => occurrence.querySelector('[role="alert"]')?.textContent).toContain('3');
});
