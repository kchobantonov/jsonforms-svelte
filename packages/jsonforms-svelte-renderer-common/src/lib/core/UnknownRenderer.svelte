<script lang="ts">
  import { UnknownRenderer as Fallback } from '@chobantonov/jsonforms-svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';

  const message = useRendererMessages(true);
</script>

<Fallback message={message('renderer.noApplicable')} />
