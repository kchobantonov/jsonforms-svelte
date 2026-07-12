<script lang="ts">
  import { type ControlProps, useJsonFormsCell } from '@chobantonov/jsonforms-svelte';
  import { setContext } from 'svelte';
  import BooleanControlRenderer from '../controls/BooleanControlRenderer.svelte';
  import { ControlWrapperSymbol } from '../util';
  import CellContent from './CellContent.svelte';
  import CellControlWrapper from './CellControlWrapper.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsCell(props);
  setContext(ControlWrapperSymbol, CellControlWrapper);
</script>

<CellContent errors={binding.cell.errors}
  ><BooleanControlRenderer
    {...props}
    uischema={{ ...props.uischema, scope: '#', label: false }}
  /></CellContent
>
