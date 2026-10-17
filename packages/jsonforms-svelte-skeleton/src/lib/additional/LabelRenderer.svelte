<script lang="ts">
  import { useJsonFormsLabel, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { LabelElement } from '@jsonforms/core';
  import { useSkeletonLabel } from '../util';

  const props: RendererProps<LabelElement> = $props();

  const binding = useSkeletonLabel(useJsonFormsLabel(props));
</script>

{#if binding.label.visible}
  <p class="text-surface-950-50 text-sm font-medium">{binding.label.text}</p>
{/if}
