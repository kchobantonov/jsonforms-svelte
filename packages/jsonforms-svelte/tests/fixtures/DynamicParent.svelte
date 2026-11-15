<script lang="ts">
  import type { UISchemaElement } from '@jsonforms/core';
  let {
    uischema,
  }: { uischema: UISchemaElement & { elements?: (UISchemaElement & { label?: string })[] } } =
    $props();
</script>

<div data-testid="parent-categories" data-child-label={uischema.elements?.[0]?.label}>
  <input aria-label="Parent draft" />
</div>
