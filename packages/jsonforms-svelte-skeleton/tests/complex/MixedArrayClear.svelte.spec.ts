import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { mountControl } from '../testUtils';
import { skeletonRenderers } from '../../src/lib/renderers';
afterEach(cleanup);
it('keeps a null array item in the tree and does not offer clearing its type', async () => {
  const { view, onchange } = mountControl({
    renderers: skeletonRenderers,
    propertySchema: {
      type: ['array', 'object', 'string', 'number', 'boolean', 'null'],
    },
    value: [null],
  });
  let toggle: HTMLButtonElement;
  await vi.waitFor(() => {
    toggle = view.container.querySelector<HTMLButtonElement>('button[title="Show primitives"]')!;
    expect(toggle).toBeTruthy();
  });
  toggle!.click();
  let item: HTMLElement;
  await vi.waitFor(() => {
    item = [...view.container.querySelectorAll<HTMLElement>('[role="treeitem"]')].find(
      (node) => node.textContent?.includes('Item 0') && !node.textContent?.includes('Item 1'),
    )!;
    expect(item).toBeTruthy();
  });
  // Pick the deepest matching node, rather than its ancestor tree item.
  const matches = [...view.container.querySelectorAll<HTMLElement>('[role="treeitem"]')].filter(
    (node) => node.textContent?.includes('Item 0'),
  );
  item = matches[matches.length - 1];
  item.click();
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
