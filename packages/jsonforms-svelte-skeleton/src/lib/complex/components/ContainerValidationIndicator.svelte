<script lang="ts">
  import type { ErrorObject } from 'ajv';
  import ValidationPopover from '../../controls/components/ValidationPopover.svelte';
  let {
    show,
    count,
    errors = [],
  }: { show: boolean; count?: number; errors?: ErrorObject[] } = $props();
</script>

<ValidationPopover visible={show} {errors} container>
  {#snippet triggerContent()}
    <span class="badge preset-filled-error-500">{count ?? '!'}</span>
  {/snippet}
</ValidationPopover>
