import { untrack } from 'svelte';
import { resolvePagination, type CollectionKind } from './collectionPagination';
import { usePendingControlChanges } from './detailDialog.svelte';

interface CollectionBinding {
  readonly keys: readonly (string | number)[];
  readonly local: unknown;
  readonly config: unknown;
  readonly kind: CollectionKind;
  readonly defaultEnabled?: boolean;
  readonly errors?: readonly { index: number; count: number }[];
}

/** Pages retain original item indices and flush child drafts before navigation. */
export function useCollectionPagination(binding: CollectionBinding) {
  const pending = usePendingControlChanges();
  const resolved = $derived(
    resolvePagination(binding.local, binding.config, binding.kind, binding.defaultEnabled),
  );
  let size = $state(untrack(() => resolved.size));
  let page = $state(1);
  let previous = untrack(() => [...binding.keys]);
  let previousSettings = untrack(() => [resolved.size, resolved.enabled] as const);
  const pages = $derived(Math.max(1, Math.ceil(binding.keys.length / size)));
  const current = $derived(Math.min(page, pages));
  const start = $derived(resolved.enabled ? (current - 1) * size : 0);
  $effect(() => {
    const keys = binding.keys;
    const settings = resolved;
    untrack(() => {
      if (settings.size !== previousSettings[0] || settings.enabled !== previousSettings[1]) {
        size = settings.size;
        page = 1;
      } else if (keys.length > previous.length) {
        const added = keys.findIndex((key) => !previous.includes(key));
        if (added >= 0) page = Math.floor(added / size) + 1;
      }
      page = Math.min(page, Math.max(1, Math.ceil(keys.length / size)));
      previous = [...keys];
      previousSettings = [settings.size, settings.enabled];
    });
  });
  const prepare = () => {
    pending.flush();
    return !pending.isBlocked();
  };
  return {
    prepare,
    get enabled() {
      return resolved.enabled;
    },
    get current() {
      return current;
    },
    get size() {
      return size;
    },
    get total() {
      return binding.keys.length;
    },
    get pages() {
      return pages;
    },
    get choices() {
      return (
        resolved.choices.includes(size) ? resolved.choices : [...resolved.choices, size]
      ).toSorted((a, b) => a - b);
    },
    get errorPages() {
      const counts: Record<number, number> = {};
      for (const error of binding.errors ?? []) {
        const number = Math.floor(error.index / size) + 1;
        if (number !== current) counts[number] = (counts[number] ?? 0) + error.count;
      }
      return Object.entries(counts).map(([number, count]) => ({ page: Number(number), count }));
    },
    get indices() {
      return binding.keys
        .map((_, index) => index)
        .slice(start, resolved.enabled ? start + size : undefined);
    },
    change(nextPage: number, nextSize = size) {
      if (!Number.isInteger(nextSize) || nextSize < 1 || !Number.isInteger(nextPage)) return false;
      if (!prepare()) return false;
      page = Math.max(
        1,
        Math.min(
          nextSize === size ? nextPage : Math.floor(start / nextSize) + 1,
          Math.max(1, Math.ceil(binding.keys.length / nextSize)),
        ),
      );
      size = nextSize;
      return true;
    },
  };
}
export type CollectionPage = ReturnType<typeof useCollectionPagination>;
