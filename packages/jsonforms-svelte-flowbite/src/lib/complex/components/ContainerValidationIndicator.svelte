<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let { show, count }: { show: boolean; count?: number } = $props();
</script>

{#if show}<Badge
    color="red"
    data-container-validation-indicator
    role="img"
    aria-label={message('validation.errors')}>{count ?? '!'}</Badge
  >{/if}
