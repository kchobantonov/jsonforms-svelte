<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let { show, count }: { show: boolean; count?: number } = $props();
</script>

{#if show}<span
    class="badge preset-filled-error-500"
    data-container-validation-indicator
    role="img"
    aria-label={message('validation.errors')}>{count ?? '!'}</span
  >{/if}
