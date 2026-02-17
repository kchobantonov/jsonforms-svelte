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
  const control = useFlowbiteLayout(useJsonFormsLayout(props));
</script>

{#if control.layout.visible}
  <Card class="mt-1 mb-1 min-w-full" {...control.flowbiteProps('Card')}>
    {#if control.layout.label}
      <Heading class="pt-2 pr-4 pb-2 pl-4 text-lg leading-none font-bold">
        {control.layout.label}
      </Heading>
    {/if}
    {#each control.layout.uischema.elements as element, index (control.layout.path + '-' + index)}
      <div class="pr-4 pb-4 pl-4">
        <DispatchRenderer
          schema={control.layout.schema}
          uischema={element}
          path={control.layout.path}
          enabled={control.layout.enabled}
          renderers={control.layout.renderers}
          cells={control.layout.cells}
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
