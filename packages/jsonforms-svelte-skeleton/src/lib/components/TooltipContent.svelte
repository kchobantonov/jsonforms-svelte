<script lang="ts">
  import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import type { ComponentProps, Snippet } from 'svelte';
  let {
    target,
    positionerClass,
    class: className = 'card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl',
    children: childrenContent,
  }: {
    target: ComponentProps<typeof Portal>['target'];
    positionerClass?: string;
    class?: string;
    children: Snippet;
  } = $props();
</script>

<Portal {target}>
  <Tooltip.Context>
    {#snippet children(tooltip)}
      <div {...tooltip().getPositionerProps()} class={positionerClass}>
        <Tooltip.Content class={className}>{@render childrenContent()}</Tooltip.Content>
      </div>
    {/snippet}
  </Tooltip.Context>
</Portal>
