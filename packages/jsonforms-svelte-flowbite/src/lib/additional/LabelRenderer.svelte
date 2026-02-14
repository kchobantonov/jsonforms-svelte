<script lang="ts">
  import { useJsonFormsLabel, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { LabelElement } from '@jsonforms/core';
  import { useFlowbiteLabel } from '../util';
  import { Label } from 'flowbite-svelte';

  const props: RendererProps<LabelElement> = $props();

  const input = useFlowbiteLabel(useJsonFormsLabel(props));
</script>

{#if input.label.visible}
  <Label {...input.flowbiteProps('Label')}>{input.label.text}</Label>
{/if}
