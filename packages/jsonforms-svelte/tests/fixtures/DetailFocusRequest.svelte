<script lang="ts">
  import { useInitialFocusRequest } from '../../src/lib/initialFocusDiagnostic.svelte';

  let { path }: { path: string } = $props();
  useInitialFocusRequest(
    () => true,
    () => path,
  );
</script>
