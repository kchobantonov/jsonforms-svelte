<script lang="ts">
  import type { UISchemaElement } from '@jsonforms/core';
  import { resolveSpacerSize, toCss } from './layoutSizing';
  const { uischema }: { uischema: UISchemaElement } = $props();
  const size = $derived(toCss(resolveSpacerSize(uischema)));
  const weight = $derived(uischema.options?.layout?.weight);
  const flexible = $derived(typeof weight === 'number' && Number.isFinite(weight) && weight > 0);
</script>

<div
  aria-hidden="true"
  data-spacer
  style:height={flexible ? undefined : size}
  style:width="100%"
  style:flex={flexible ? `${weight} 1 0` : undefined}
  style:flex-shrink={flexible ? undefined : '0'}
  style:min-width="0"
  style:min-height="0"
></div>
