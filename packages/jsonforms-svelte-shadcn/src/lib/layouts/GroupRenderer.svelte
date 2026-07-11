<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsLayout,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import * as Card from '$lib/components/ui/card';
  import { useShadcnLayout } from '../util';
  import type { Snippet } from 'svelte';

  // eslint-disable-next-line svelte/no-unused-props
  const props: RendererProps<Layout> & { children?: Snippet } = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
</script>

{#if binding.layout.visible}
  <Card.Root class="my-1 min-w-full" {...binding.shadcnProps('card')}>
    {#if binding.layout.label}
      <Card.Header>
        <Card.Title>
          {binding.layout.label}
        </Card.Title>
      </Card.Header>
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
  </Card.Root>
{/if}
