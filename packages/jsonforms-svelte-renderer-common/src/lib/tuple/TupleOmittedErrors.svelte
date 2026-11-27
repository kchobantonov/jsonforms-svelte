<script lang="ts">
  import { useRendererMessages } from '../locale/rendererMessages.svelte.js';

  let { errors }: { errors: { index: number; text: string }[] } = $props();
  const message = useRendererMessages();
</script>

{#if errors.length}
  <ul data-tuple-omitted-errors aria-label={message('tuple.omittedErrors')}>
    {#each errors.slice(0, 5) as error (error.index)}<li role="alert">
        {error.text}
      </li>{/each}
  </ul>
  {#if errors.length > 5}
    <details>
      <summary>{message('tuple.morePositionErrors', { count: errors.length - 5 })}</summary>
      <ul>
        {#each errors.slice(5) as error (error.index)}<li>{error.text}</li>{/each}
      </ul>
    </details>
  {/if}
{/if}
