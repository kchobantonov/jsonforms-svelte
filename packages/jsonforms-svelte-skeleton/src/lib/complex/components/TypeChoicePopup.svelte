<script lang="ts">
  import { Combobox, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { ComponentProps } from 'svelte';
  let {
    target,
    items,
  }: { target: ComponentProps<typeof Portal>['target']; items: { name: string; value: string }[] } =
    $props();
</script>

<Portal {target}>
  <Combobox.Positioner
    ><Combobox.Content
      class="max-h-[min(20rem,var(--available-height,20rem),calc(100dvh-2rem))] overflow-y-auto"
    >
      {#each items as item (item.value)}
        <Combobox.Item {item}
          ><Combobox.ItemText>{item.name}</Combobox.ItemText><Combobox.ItemIndicator
          /></Combobox.Item
        >
      {/each}
    </Combobox.Content></Combobox.Positioner
  >
</Portal>
