<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { useArrayLayout } from './arrayLayout.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const message = useRendererMessages();
  const {
    index,
    collection,
    hideAvatar,
    avatar,
    Title,
  }: {
    index: number;
    collection: ReturnType<typeof useArrayLayout>['collection'];
    hideAvatar: boolean;
    avatar: Snippet;
    Title?: Component<{ class: string; children: Snippet }>;
  } = $props();
  const headingClass = $derived(
    `truncate text-sm font-medium ${hideAvatar && collection.childErrors(index).length ? 'ps-7' : ''}`,
  );
</script>

{#snippet title()}
  {#if hideAvatar}<span class="sr-only"
      >{message('collection.index', { index: index + 1 })}:
    </span>{/if}
  {collection.childLabelForIndex(index)}
{/snippet}
<div class="flex min-w-0 flex-1 items-center gap-3">
  {#if !hideAvatar}<div data-array-avatar class="relative shrink-0">{@render avatar()}</div>{/if}
  {#if Title}<Title class={headingClass}>{@render title()}</Title>{:else}<h3 class={headingClass}>
      {@render title()}
    </h3>{/if}
</div>
