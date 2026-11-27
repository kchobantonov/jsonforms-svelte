<script lang="ts">
  import { getContext } from 'svelte';
  import { ControlFrame } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlWrapperProps, ControlWrapperSymbol, type ControlWrapperType } from '../util';
  import DefaultControlWrapper from './components/DefaultControlWrapper.svelte';

  const { children, ...rendererProps }: ControlWrapperProps = $props();

  const WrapperComponent: ControlWrapperType =
    getContext<ControlWrapperType>(ControlWrapperSymbol) ?? DefaultControlWrapper;
</script>

<ControlFrame {rendererProps} {children}>
  {#snippet wrapper(adorned)}
    <WrapperComponent {...rendererProps}>{@render adorned()}</WrapperComponent>
  {/snippet}
</ControlFrame>
