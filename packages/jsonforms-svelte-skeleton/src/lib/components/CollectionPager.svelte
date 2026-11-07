<script lang="ts">
  import { useRendererMessages, type CollectionPage } from '@chobantonov/jsonforms-svelte';

  let { page }: { page: CollectionPage } = $props();
  const message = useRendererMessages();
  const showSize = $derived(page.choices.some((size) => size < page.total));
</script>

{#if page.enabled && page.total > 0 && (page.pages > 1 || showSize)}
  <footer
    data-collection-footer
    class="flex flex-wrap items-center justify-end gap-2 border-t py-3"
  >
    <nav aria-label={message('collection.pagination')} class="flex flex-wrap items-center gap-2">
      {#if showSize}
        <select
          class="select w-20"
          aria-label={message('collection.pageSize')}
          value={page.size}
          onchange={(event) => page.change(page.current, Number(event.currentTarget.value))}
        >
          {#each page.choices as size (size)}<option value={size}>{size}</option>{/each}
        </select>
      {/if}
      {#if page.pages > 1}
        <button
          type="button"
          class="btn-icon btn-icon-sm preset-tonal"
          disabled={page.current === 1}
          aria-label={message('collection.previous')}
          onclick={() => page.change(page.current - 1)}>‹</button
        >
        <span aria-live="polite"
          >{message('collection.page', { current: page.current, pages: page.pages })}</span
        >
        <button
          type="button"
          class="btn-icon btn-icon-sm preset-tonal"
          disabled={page.current === page.pages}
          aria-label={message('collection.next')}
          onclick={() => page.change(page.current + 1)}>›</button
        >
      {/if}
      {#each page.errorPages as error (error.page)}
        <button
          type="button"
          class="btn btn-sm preset-tonal-error"
          onclick={() => page.change(error.page)}
          >{message('collection.errorPage', { page: error.page, count: error.count })}</button
        >
      {/each}
    </nav>
  </footer>
{/if}
