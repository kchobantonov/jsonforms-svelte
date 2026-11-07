<script lang="ts">
  import { ChevronDownOutline } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';
  let {
    expanded,
    collapsible,
    label,
    selector,
    indicator,
    children,
    onExpandedChange,
  }: {
    expanded: boolean;
    collapsible: boolean;
    label: string;
    selector: Snippet;
    indicator?: Snippet;
    children: Snippet;
    onExpandedChange: (expanded: boolean) => void;
  } = $props();
  const contentId = $props.id();
</script>

<div>
  <div
    class={`flex min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 transition-colors dark:border-gray-700 dark:bg-gray-800 ${collapsible ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
    data-mixed-frame-header
  >
    <div class="max-w-sm min-w-32 flex-1">{@render selector()}</div>
    {@render indicator?.()}
    {#if collapsible}
      <button
        type="button"
        data-mixed-collapse="true"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={contentId}
        class="flex min-w-10 flex-1 items-center justify-end rounded-md p-2 text-start focus-visible:outline-2"
        onclick={() => onExpandedChange(!expanded)}
      >
        <ChevronDownOutline class={expanded ? 'size-4 rotate-180' : 'size-4'} />
      </button>
    {:else}
      <span class="min-w-0 flex-1"></span>
    {/if}
  </div>
  <div id={contentId} hidden={!expanded} class="pt-3">{@render children()}</div>
</div>
