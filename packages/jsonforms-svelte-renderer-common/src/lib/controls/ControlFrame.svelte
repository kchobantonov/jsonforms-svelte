<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { RendererControlWrapperProps } from './controlWrapperProps';
  import InputAdornments from './InputAdornments.svelte';
  const {
    rendererProps,
    children,
    wrapper,
  }: {
    rendererProps: Pick<RendererControlWrapperProps, 'id' | 'schema' | 'visible' | 'label'> & {
      appliedOptions: Record<string, unknown>;
    };
    children: Snippet;
    wrapper: Snippet<[Snippet]>;
  } = $props();
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
  {@render wrapper(adorned)}
{/if}
