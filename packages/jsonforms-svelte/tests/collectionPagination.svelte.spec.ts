import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import PaginationHarness from './fixtures/PaginationHarness.svelte';
import SiblingPaginationHarness from './fixtures/SiblingPaginationHarness.svelte';
import type { CollectionPage } from '../src/lib/collectionPagination.svelte';
afterEach(cleanup);

it('retains the first visible item on size changes, clamps deletion and reveals additions', async () => {
  let page!: CollectionPage;
  const keys = Array.from({ length: 12 }, (_, index) => index + 1);
  const view = await render(PaginationHarness, {
    props: {
      keys,
      capture: (value) => {
        page = value;
      },
    },
  });
  await tick();
  expect(page.indices).toEqual([0, 1, 2, 3, 4]);
  page.change(3);
  expect(page.indices).toEqual([10, 11]);
  page.change(3, 3);
  expect(page.current).toBe(4);
  expect(page.indices).toEqual([9, 10, 11]);
  await view.rerender({ keys: keys.slice(0, 4) });
  expect(page.current).toBe(2);
  expect(page.indices).toEqual([3]);
  await view.rerender({ keys: [1, 2, 3, 4, 13, 14, 15] });
  expect(page.current).toBe(2);
  expect(page.indices).toContain(4);
  await view.rerender({ local: { pageSize: 2, pageSizeOptions: [2, 4] } });
  expect(page.current).toBe(1);
  expect(page.size).toBe(2);
  await view.rerender({ local: false });
  expect(page.indices).toHaveLength(7);
  expect(page.enabled).toBe(false);
});

it('navigates and flushes sibling collection scopes without recursive parent traversal', async () => {
  const pages: CollectionPage[] = [];
  const flushed = [0, 0];
  await render(SiblingPaginationHarness, {
    props: {
      capture: (index, page) => {
        pages[index] = page;
      },
      onFlush: (index) => {
        flushed[index]++;
      },
    },
  });
  await tick();
  expect(pages).toHaveLength(2);
  expect(pages[0].change(2)).toBe(true);
  expect(pages[0].current).toBe(2);
  expect(pages[1].current).toBe(1);
  expect(flushed).toEqual([1, 1]);
});

it('prevents navigation while a sibling collection has a blocked edit', async () => {
  const pages: CollectionPage[] = [];
  const view = await render(SiblingPaginationHarness, {
    props: {
      blockSecond: true,
      capture: (index, page) => {
        pages[index] = page;
      },
    },
  });
  await tick();
  expect(pages[0].change(2)).toBe(false);
  expect(pages[0].current).toBe(1);
  await view.rerender({ blockSecond: false });
  expect(pages[0].change(2)).toBe(true);
  expect(pages[0].current).toBe(2);
});
