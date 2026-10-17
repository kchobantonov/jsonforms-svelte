<script lang="ts">
  import { Button } from 'flowbite-svelte';
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
  <div class="flex items-center gap-3" data-mixed-frame-header>
    <div class="min-w-32 shrink-0">{@render selector()}</div>
    {@render indicator?.()}
    {#if collapsible}
      <Button
        type="button"
        data-mixed-collapse
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={contentId}
        class="flex min-w-0 flex-1 items-center justify-end gap-3 rounded-md p-2 text-start focus-visible:outline-2"
        onclick={() => onExpandedChange(!expanded)}
        color="alternative"
      >
        <ChevronDownOutline class={expanded ? 'size-4 rotate-180' : 'size-4'} />
      </Button>
    {:else}
      <span class="min-w-0 flex-1"></span>
    {/if}
  </div>
  <div id={contentId} hidden={!expanded} class="pt-3">{@render children()}</div>
</div>
