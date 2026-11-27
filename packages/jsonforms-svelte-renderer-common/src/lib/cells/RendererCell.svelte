<script lang="ts">
  import { setContext, untrack, type Component, type Snippet } from 'svelte';
  import { CellPresentationContextSymbol, CellValidationContextSymbol } from '../core/types';
  import { useJsonFormsCell, type ControlProps } from '../core/jsonFormsCompositions.svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import CellControlWrapper from './CellControlWrapper.svelte';

  const {
    wrapperKey,
    renderer,
    content: Content,
    ...props
  }: ControlProps & {
    wrapperKey: symbol;
    renderer?: Component<ControlProps>;
    content: Component<{ errors?: string; children: Snippet }>;
  } = $props();
  const binding = useJsonFormsCell(props);
  let rendererError = $state('');
  setContext(
    untrack(() => wrapperKey),
    CellControlWrapper,
  );
  if (untrack(() => !renderer)) {
    setContext(CellPresentationContextSymbol, true);
    setContext(CellValidationContextSymbol, (error: string) => {
      rendererError = error;
    });
  }
  const Renderer = $derived(renderer ?? DispatchRenderer);
</script>

<Content errors={rendererError || binding.cell.errors}>
  <Renderer {...props} uischema={{ ...props.uischema, scope: '#', label: false }} />
</Content>
