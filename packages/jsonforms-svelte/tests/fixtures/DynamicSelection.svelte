<script module lang="ts">
  let sequence = 0;
</script>

<script lang="ts">
  import type { UISchemaElement } from '@jsonforms/core';
  let { uischema }: { uischema: UISchemaElement } = $props();
  const instance = ++sequence;
  const label = $derived('label' in uischema ? uischema.label : '');
  const gap = $derived((uischema as { options?: { gap?: number } }).options?.gap);
</script>

<div
  data-testid="dynamic-renderer"
  data-mode="automatic"
  data-instance={'automatic:' + instance}
  data-label={label}
  data-gap={gap}
></div>
