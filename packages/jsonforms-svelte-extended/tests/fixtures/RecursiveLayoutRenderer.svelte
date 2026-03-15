<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsLayout,
    type RendererProps,
  } from "@chobantonov/jsonforms-svelte";
  import type { Layout } from "@jsonforms/core";

  const props: RendererProps<Layout> = $props();
  const binding = useJsonFormsLayout(props);
</script>

{#if binding.layout.visible}
  <div data-testid="recursive-layout">
    {#each binding.layout.uischema.elements as element, index (`${element.type}-${index}`)}
      <DispatchRenderer
        schema={binding.layout.schema}
        uischema={element}
        path={binding.layout.path}
        enabled={binding.layout.enabled}
        renderers={binding.layout.renderers}
        cells={binding.layout.cells}
      />
    {/each}
  </div>
{/if}
