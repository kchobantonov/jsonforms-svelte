<script lang="ts">
  import { useRendererMessages } from '../rendererMessages.svelte';

  const message = useRendererMessages(true);
</script>

<div role="status" style="color: red;">{message('renderer.noApplicable')}</div>
