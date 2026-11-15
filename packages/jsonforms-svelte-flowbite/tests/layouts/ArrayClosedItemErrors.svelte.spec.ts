import { type JsonSchema } from '@jsonforms/core';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as arrayLayout } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as stringControl } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as layout } from '../../src/lib/layouts/LayoutRenderer.entry';
import { mountControl } from '../testUtils';

afterEach(cleanup);

it.each([
  {
    name: 'child minimum length',
    item: { type: 'object', properties: { name: { type: 'string', minLength: 2 } } },
    invalid: { name: 'x', extra: 'x' },
    message: /(?:at least|fewer than) 2 characters/i,
  },
  {
    name: 'missing required property',
    item: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    invalid: { extra: 'x' },
    message: /required/i,
  },
  {
    name: 'item object minimum properties',
    item: { type: 'object', minProperties: 2, properties: { name: { type: 'string' } } },
    invalid: { name: 'Ada' },
    message: /2 properties/i,
  },
])(
  'shows the $name error only on the closed item at index 10',
  async ({ item, invalid, message }) => {
    const { view } = await mountControl({
      renderers: [arrayLayout, stringControl, layout],
      propertySchema: {
        type: 'array',
        items: item,
      } as JsonSchema,
      options: { table: false, pagination: false, hideArraySummaryValidation: true },
      value: Array.from({ length: 11 }, (_, index) =>
        index === 10 ? invalid : { name: 'Ada', extra: 'x' },
      ),
    });
    expect(view.container.querySelectorAll('[data-row-summary]')).toHaveLength(1);
    const indicator = view.container.querySelector<HTMLElement>('[data-row-summary]')!;
    const disclosure =
      indicator.parentElement?.parentElement?.parentElement?.querySelector('button[aria-expanded]');
    expect(disclosure?.getAttribute('aria-expanded')).toBe('false');
    (indicator.querySelector('button') ?? indicator).dispatchEvent(new MouseEvent('mouseenter'));
    await expect
      .poll(() => document.querySelector('[data-error-summary]')?.textContent ?? '')
      .toMatch(message);
    expect(disclosure?.getAttribute('aria-expanded')).toBe('false');
  },
);
