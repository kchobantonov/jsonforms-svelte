<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { DemoExample } from '../examples/definitions';
  type Action = NonNullable<DemoExample['actions']>[number];
  const {
    actions,
    apply,
    button,
  }: {
    actions: DemoExample['actions'];
    apply(action: Action): void;
    button: Snippet<[string, () => void]>;
  } = $props();
</script>

<div class="flex items-center justify-between gap-4">
  <h2 class="text-xl font-bold">JSON Forms</h2>
  {#if actions}
    <div class="flex flex-wrap gap-2">
      {#each actions as action (action.label)}
        {@render button(action.label, () => apply(action))}
      {/each}
    </div>
  {/if}
</div>
