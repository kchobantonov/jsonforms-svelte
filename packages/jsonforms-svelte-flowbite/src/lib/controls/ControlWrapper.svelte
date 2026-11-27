<script lang="ts">
  import { getContext } from 'svelte';
  import { InputAdornments } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlWrapperProps, ControlWrapperSymbol, type ControlWrapperType } from '../util';
  import DefaultControlWrapper from './components/DefaultControlWrapper.svelte';

  const { children, ...rendererProps }: ControlWrapperProps = $props();

  const WrapperComponent: ControlWrapperType =
    getContext<ControlWrapperType>(ControlWrapperSymbol) ?? DefaultControlWrapper;
</script>

{#snippet adorned()}
  <InputAdornments
    id={rendererProps.id}
    schema={rendererProps.schema}
    options={rendererProps.appliedOptions}
  >
    {@render children()}
  </InputAdornments>
{/snippet}

{#if rendererProps.appliedOptions.hideControlWrapper}
  {#if rendererProps.visible}
    {#if rendererProps.label}
      <label class="sr-only" for={`${rendererProps.id}-input`}>{rendererProps.label}</label>
    {/if}
    {@render adorned()}
  {/if}
{:else}
  <WrapperComponent {...rendererProps}>
    {@render adorned()}
  </WrapperComponent>
{/if}
