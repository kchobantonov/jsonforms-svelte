<script lang="ts">
  import {
    DispatchRenderer,
    CellPresentationContextSymbol,
    CellValidationContextSymbol,
    type ControlProps,
    useJsonFormsCell,
  } from '@chobantonov/jsonforms-svelte';
  import { setContext } from 'svelte';
  import { ControlWrapperSymbol } from '../util';
  import CellContent from './CellContent.svelte';
  import CellControlWrapper from './CellControlWrapper.svelte';

  const props: ControlProps = $props();
  const binding = useJsonFormsCell(props);
  let rendererError = $state('');
  setContext(ControlWrapperSymbol, CellControlWrapper);
  setContext(CellPresentationContextSymbol, true);
  setContext(CellValidationContextSymbol, (error: string) => {
    rendererError = error;
  });
</script>

<CellContent errors={rendererError || binding.cell.errors}>
  <DispatchRenderer {...props} uischema={{ ...props.uischema, scope: '#', label: false }} />
</CellContent>
