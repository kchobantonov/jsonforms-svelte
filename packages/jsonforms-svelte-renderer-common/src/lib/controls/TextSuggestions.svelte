<script lang="ts">
  const { id, suggestions }: { id?: string; suggestions?: string[] } = $props();
</script>

{#if id}
  <datalist {id}>
    {#each suggestions ?? [] as suggestion (suggestion)}<option value={suggestion}></option>{/each}
  </datalist>
{/if}
