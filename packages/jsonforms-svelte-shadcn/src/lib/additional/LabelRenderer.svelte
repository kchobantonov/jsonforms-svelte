<script lang="ts">
  import { useJsonFormsLabel, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { LabelElement } from '@jsonforms/core';
  import { useShadcnLabel } from '../util';

  const props: RendererProps<LabelElement> = $props();

  const binding = useShadcnLabel(useJsonFormsLabel(props));
</script>

{#if binding.label.visible}
  <p class="text-foreground text-sm font-medium">{binding.label.text}</p>
{/if}
