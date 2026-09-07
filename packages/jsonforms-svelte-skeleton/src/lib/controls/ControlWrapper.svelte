<script lang="ts">
  import { getContext } from 'svelte';
  import { type ControlWrapperProps, ControlWrapperSymbol, type ControlWrapperType } from '../util';
  import DefaultControlWrapper from './components/DefaultControlWrapper.svelte';

  const { children, ...rendererProps }: ControlWrapperProps = $props();

  const WrapperComponent: ControlWrapperType =
    getContext<ControlWrapperType>(ControlWrapperSymbol) ?? DefaultControlWrapper;
</script>

{#if rendererProps.appliedOptions.hideControlWrapper}
  {#if rendererProps.visible}
    {@render children()}
  {/if}
{:else}
  <WrapperComponent {...rendererProps}>
    {@render children()}
  </WrapperComponent>
{/if}
