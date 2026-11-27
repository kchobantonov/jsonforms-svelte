<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { CollectionPage } from './collectionPagination.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';

  type PageAction = { type: 'button'; disabled?: boolean; 'aria-label'?: string; onclick(): void };
  const {
    page,
    sizeSelect,
    button,
  }: {
    page: CollectionPage;
    sizeSelect: Snippet<[label: string, change: (value: string) => void]>;
    button: Snippet<[attributes: PageAction, text: string, error: boolean]>;
  } = $props();
  const message = useRendererMessages();
  const showSize = $derived(page.choices.some((size) => size < page.total));
  function navigation(offset: -1 | 1): PageAction {
    return {
      type: 'button',
      disabled: offset === -1 ? page.current === 1 : page.current === page.pages,
      'aria-label': message(offset === -1 ? 'collection.previous' : 'collection.next'),
      onclick: () => page.change(page.current + offset),
    };
  }
</script>

{#if page.enabled && page.total > 0 && (page.pages > 1 || showSize)}
  <footer
    data-collection-footer
    class="flex flex-wrap items-center justify-end gap-2 border-t py-3"
  >
    <nav aria-label={message('collection.pagination')} class="flex flex-wrap items-center gap-2">
      {#if showSize}
        {@render sizeSelect(message('collection.pageSize'), (value) =>
          page.change(page.current, Number(value)),
        )}
      {/if}
      {#if page.pages > 1}
        {@render button(navigation(-1), '‹', false)}
        <span aria-live="polite"
          >{message('collection.page', { current: page.current, pages: page.pages })}</span
        >
        {@render button(navigation(1), '›', false)}
      {/if}
      {#each page.errorPages as error (error.page)}
        {@render button(
          { type: 'button', onclick: () => page.change(error.page) },
          message('collection.errorPage', { page: error.page, count: error.count }),
          true,
        )}
      {/each}
    </nav>
  </footer>
{/if}
