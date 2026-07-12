<script lang="ts">
  import { type ControlProps, useJsonFormsCell } from '@chobantonov/jsonforms-svelte';
  import { setContext, type Component } from 'svelte';
  import { ControlWrapperSymbol } from '../util';
  import CellContent from './CellContent.svelte';
  import CellControlWrapper from './CellControlWrapper.svelte';
  const { renderer: Renderer, ...props }: ControlProps & { renderer: Component<ControlProps> } =
    $props();
  const binding = useJsonFormsCell(props);
  setContext(ControlWrapperSymbol, CellControlWrapper);
</script>

<CellContent errors={binding.cell.errors}
  ><Renderer {...props} uischema={{ ...props.uischema, scope: '#', label: false }} /></CellContent
>
