<script lang="ts">
  import { useRendererMessages, type CollectionPage } from '@chobantonov/jsonforms-svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import { getPortalTarget } from '../util';
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
        <Select.Root
          type="single"
          value={String(page.size)}
          onValueChange={(value) => page.change(page.current, Number(value))}
        >
          <Select.Trigger aria-label={message('collection.pageSize')} class="w-20"
            >{page.size}</Select.Trigger
          >
          <Select.Content portalProps={{ to: getPortalTarget() }}>
            {#each page.choices as size (size)}<Select.Item
                value={String(size)}
                label={String(size)}>{size}</Select.Item
              >{/each}
          </Select.Content>
        </Select.Root>
      {/if}
      {#if page.pages > 1}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page.current === 1}
          aria-label={message('collection.previous')}
          onclick={() => page.change(page.current - 1)}>‹</Button
        >
        <span aria-live="polite"
          >{message('collection.page', { current: page.current, pages: page.pages })}</span
        >
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page.current === page.pages}
          aria-label={message('collection.next')}
          onclick={() => page.change(page.current + 1)}>›</Button
        >
      {/if}
      {#each page.errorPages as error (error.page)}
        <Button type="button" variant="outline" size="sm" onclick={() => page.change(error.page)}
          >{message('collection.errorPage', { page: error.page, count: error.count })}</Button
        >
      {/each}
    </nav>
  </footer>
{/if}
