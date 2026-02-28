<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsLayout,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Card, Heading } from 'flowbite-svelte';
  import { useFlowbiteLayout } from '../util';
  import type { Snippet } from 'svelte';

  const props: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
</script>

{#if binding.layout.visible}
  <Card class="mt-1 mb-1 min-w-full" {...binding.flowbiteProps('Card')}>
    {#if binding.layout.label}
      <Heading tag="h3" class="pt-2 pr-4 pb-2 pl-4 text-lg leading-none font-bold">
        {binding.layout.label}
      </Heading>
    {/if}
    {#each binding.layout.uischema.elements as element, index (binding.layout.path + '-' + index)}
      <div class="pr-4 pb-4 pl-4">
        <DispatchRenderer
          schema={binding.layout.schema}
          uischema={element}
          path={binding.layout.path}
          enabled={binding.layout.enabled}
          renderers={binding.layout.renderers}
          cells={binding.layout.cells}
        />
      </div>
    {/each}
    {#if props.children}
      <div class="pr-4 pb-4 pl-4">
        {@render props.children()}
      </div>
    {/if}
  </Card>
{/if}
