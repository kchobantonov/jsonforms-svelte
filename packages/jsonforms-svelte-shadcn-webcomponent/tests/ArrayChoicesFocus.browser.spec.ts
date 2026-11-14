import { afterEach, expect, it, vi } from 'vite-plus/test';
import '../src/lib/webcomponent-register.js';

let element: HTMLElement | undefined;
afterEach(() => element?.remove());

it('focuses the Array Choices multi-select trigger on mount', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  Object.assign(element, {
    schema: {
      type: 'object',
      properties: {
        choices: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['A', 'B'] } },
      },
    },
    data: { choices: [] },
    uischema: {
      type: 'Control',
      scope: '#/properties/choices',
      options: { variant: 'multi-select', focus: true },
    },
  });
  document.body.append(element);
  const trigger = await vi.waitFor(() => {
    const node = element?.shadowRoot?.querySelector<HTMLElement>('[role="combobox"]');
    expect(node).not.toBeNull();
    return node!;
  });
  await vi.waitFor(() => expect(element?.shadowRoot?.activeElement).toBe(trigger));
  expect((element as HTMLElement & { data: unknown }).data).toEqual({ choices: [] });
});
