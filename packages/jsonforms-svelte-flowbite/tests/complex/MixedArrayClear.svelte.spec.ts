import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { mountControl } from '../testUtils';
import { flowbiteRenderers } from '../../src/lib/renderers';
afterEach(cleanup);
it('keeps a null array item in the tree and does not offer clearing its type', async () => {
  const { view, onchange } = mountControl({
    renderers: flowbiteRenderers,
    propertySchema: {
      type: ['array', 'object', 'string', 'number', 'boolean', 'null'],
    },
    value: [null],
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('h2 > button[aria-expanded]')).toBeTruthy(),
  );
  (view.container.querySelector('h2 > button[aria-expanded]') as HTMLButtonElement).click();
  let toggle: HTMLButtonElement;
  await vi.waitFor(() => {
    toggle = view.container.querySelector<HTMLButtonElement>('button[title="Show primitives"]')!;
    expect(toggle).toBeTruthy();
  });
  toggle!.click();
  await vi.waitFor(() =>
    expect(view.container.querySelector('[role="button"][aria-label="Expand"]')).toBeTruthy(),
  );
  (view.container.querySelector('[role="button"][aria-label="Expand"]') as HTMLElement).click();
  let item: HTMLElement;
  await vi.waitFor(() => {
    item = [...view.container.querySelectorAll<HTMLElement>('span')].find(
      (node) => node.textContent?.trim() === 'Item 0',
    )!;
    expect(item).toBeTruthy();
  });
  item!.click();
  await vi.waitFor(() => {
    const selectors = view.container.querySelectorAll('[id$="-input-selector"]');
    expect(selectors.length).toBeGreaterThan(0);
  });
  await vi.waitFor(() => {
    const typeSelectors = [
      ...view.container.querySelectorAll<HTMLElement>('[id$="-input-selector"]'),
    ];
    const selectedType = typeSelectors[typeSelectors.length - 1];
    const label =
      selectedType instanceof HTMLSelectElement
        ? selectedType.selectedOptions[0]?.textContent
        : selectedType instanceof HTMLInputElement
          ? selectedType.value
          : selectedType.textContent;
    expect(label?.toLowerCase()).toContain('null');
  });
  const clearButtons = [
    ...view.container.querySelectorAll(
      'button[aria-label="Clear value"],button[aria-label="Clear"]',
    ),
  ];
  // The parent array may be cleared; the actual null item must not have a clear-type action.
  expect(clearButtons.length).toBeLessThanOrEqual(1);
  expect(onchange.mock.lastCall?.[0].data.value).toEqual([null]);
  expect(onchange.mock.lastCall?.[0].errors).toEqual([]);
});
