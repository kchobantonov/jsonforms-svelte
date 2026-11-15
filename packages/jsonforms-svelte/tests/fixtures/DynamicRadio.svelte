<script module lang="ts">
  let sequence = 0;
</script>

<script lang="ts">
  import type { UISchemaElement } from '@jsonforms/core';
  let { uischema }: { uischema: UISchemaElement } = $props();
  const instance = ++sequence;
  const label = $derived('label' in uischema ? uischema.label : '');
</script>

<div
  data-testid="dynamic-renderer"
  data-mode="radio"
  data-instance={'radio:' + instance}
  data-label={label}
>
  <input type="hidden" value="hidden-before-editor" />
  <button type="button" data-testid="dynamic-radio-focus">Radio choice</button>
</div>
