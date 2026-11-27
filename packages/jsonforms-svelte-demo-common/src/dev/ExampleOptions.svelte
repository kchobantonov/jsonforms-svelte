<script lang="ts">
  import type { ExampleDescription } from './examples';
  const { examples }: { examples: readonly ExampleDescription[] } = $props();
</script>

{#each examples as example (example.name)}
  <option value={example.name}>{example.label}</option>
{/each}
