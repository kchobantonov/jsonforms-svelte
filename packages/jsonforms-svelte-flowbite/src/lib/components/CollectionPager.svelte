<script lang="ts">
  import { useRendererMessages, type CollectionPage } from '@chobantonov/jsonforms-svelte';
  import { Button, Select } from 'flowbite-svelte';
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
        <Select
          placeholder=""
          size="sm"
          class="w-20"
          aria-label={message('collection.pageSize')}
          value={String(page.size)}
          items={page.choices.map((size) => ({ value: String(size), name: String(size) }))}
          onchange={(event) => page.change(page.current, Number(event.currentTarget.value))}
        />
      {/if}
      {#if page.pages > 1}
        <Button
          type="button"
          color="alternative"
          size="sm"
          disabled={page.current === 1}
          aria-label={message('collection.previous')}
          onclick={() => page.change(page.current - 1)}>‹</Button
        >
        <span aria-live="polite"
          >{message('collection.page', { current: page.current, pages: page.pages })}</span
        >
        <Button
          type="button"
          color="alternative"
          size="sm"
          disabled={page.current === page.pages}
          aria-label={message('collection.next')}
          onclick={() => page.change(page.current + 1)}>›</Button
        >
      {/if}
      {#each page.errorPages as error (error.page)}
        <Button type="button" color="alternative" size="sm" onclick={() => page.change(error.page)}
          >{message('collection.errorPage', { page: error.page, count: error.count })}</Button
        >
      {/each}
    </nav>
  </footer>
{/if}
