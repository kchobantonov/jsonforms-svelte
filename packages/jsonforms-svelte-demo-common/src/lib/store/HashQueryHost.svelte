<script lang="ts">
  import { useHistoryHashQuery } from './index.svelte';

  const formOnly = useHistoryHashQuery('form-only', false as boolean);
</script>

<output data-testid="form-only">{String(formOnly.value)}</output>
<button type="button" onclick={() => (formOnly.value = !formOnly.value)}>Toggle form only</button>
