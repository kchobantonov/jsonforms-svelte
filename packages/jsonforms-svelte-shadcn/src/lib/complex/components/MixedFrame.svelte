<script lang="ts">
  import * as Collapsible from '@jsonforms-svelte-shadcn-ui/collapsible';
  import { ChevronDownIcon } from '$lib/components/icons';
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

<Collapsible.Root open={expanded} onOpenChange={onExpandedChange}>
  <div class="flex items-center gap-3" data-mixed-frame-header>
    <div class="min-w-32 shrink-0">{@render selector()}</div>
    {@render indicator?.()}
    {#if collapsible}
      <Collapsible.Trigger
        type="button"
        data-mixed-collapse
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={contentId}
        class="flex min-w-0 flex-1 items-center justify-end gap-3 rounded-md p-2 text-start focus-visible:outline-2"
      >
        <ChevronDownIcon class={expanded ? 'size-4 rotate-180' : 'size-4'} />
      </Collapsible.Trigger>
    {:else}
      <span class="min-w-0 flex-1"></span>
    {/if}
  </div>
  <Collapsible.Content
    id={contentId}
    forceMount
    hiddenUntilFound={false}
    hidden={!expanded}
    class="pt-3">{@render children()}</Collapsible.Content
  >
</Collapsible.Root>
