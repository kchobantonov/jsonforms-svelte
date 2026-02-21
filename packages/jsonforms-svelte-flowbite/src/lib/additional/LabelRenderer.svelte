<script lang="ts">
  import { useJsonFormsLabel, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { LabelElement } from '@jsonforms/core';
  import { useFlowbiteLabel } from '../util';
  import { Label } from 'flowbite-svelte';

  const props: RendererProps<LabelElement> = $props();

  const binding = useFlowbiteLabel(useJsonFormsLabel(props));
</script>

{#if binding.label.visible}
  <Label {...binding.flowbiteProps('Label')}>{binding.label.text}</Label>
{/if}
