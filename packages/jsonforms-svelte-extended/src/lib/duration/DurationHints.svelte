<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { useDurationControl } from './durationControl.svelte';
  const message = useRendererMessages();
  let { duration, id }: { duration: ReturnType<typeof useDurationControl>; id: string } = $props();
</script>

<datalist id={`${id}-duration-completions`}>
  {#each duration.completions as value (value)}<option {value}></option>{/each}
</datalist>
{#if duration.editor.invalidText}<p id={`${id}-duration-draft`} role="status" class="text-sm">
    {message('duration.incomplete')}
  </p>{/if}
