<script lang="ts">
  import type { useArrayChoices } from './arrayChoices.svelte';
  const { model, id }: { model: ReturnType<typeof useArrayChoices>; id: string } = $props();
</script>

{#if model.finite}
  <datalist id={`${id}-choices`}>
    {#each model.binding.control.options ?? [] as choice, index (index)}
      <option value={String(choice.value)}>{choice.label}</option>
    {/each}
  </datalist>
{/if}
