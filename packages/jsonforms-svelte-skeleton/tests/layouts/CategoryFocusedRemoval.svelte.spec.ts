import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { skeletonRenderers } from '../../src/lib/renderers';
import CategoryRemovalHost from './CategoryRemovalHost.svelte';

afterEach(cleanup);

it.each([false, true])(
  'removes the focused first Category without native errors (indicator %s)',
  async (indicator) => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 3 },
        city: { type: 'string' },
      },
    } as JsonSchema;
    const uischema = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          name: 'general',
          label: 'General',
          options: { showValidationIndicator: indicator },
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        },
        {
          type: 'Category',
          name: 'place',
          label: 'Place',
          elements: [{ type: 'Control', scope: '#/properties/city' }],
        },
      ],
    } as UISchemaElement;
    const onchange = vi.fn();
    const view = await render(CategoryRemovalHost, {
      props: {
        schema,
        uischema,
        data: { name: 'Jo', city: 'Boston' },
        renderers: skeletonRenderers,
        onchange,
        removeFirst: true,
      },
    });
    view.container.querySelector<HTMLButtonElement>('[role="tab"]')!.focus();
    const previous = onchange.mock.calls.length;
    view.container.querySelector<HTMLButtonElement>('button')!.click();
    await expect
      .poll(() => view.container.querySelector('[role="tab"][aria-selected="true"]')?.textContent)
      .toContain('Place');
    await expect
      .poll(() => document.activeElement?.getAttribute('data-category-key'))
      .toBe('name:place');
    await expect
      .poll(() =>
        [...view.container.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent),
      )
      .toEqual(['Place']);
    expect(onchange.mock.calls.length).toBe(previous);
  },
);
