<script lang="ts">
  import { Badge } from '@jsonforms-svelte-shadcn-ui/badge';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let { show, count }: { show: boolean; count?: number } = $props();
</script>

{#if show}<Badge
    variant="destructive"
    data-container-validation-indicator
    role="img"
    aria-label={message('validation.errors')}>{count ?? '!'}</Badge
  >{/if}
