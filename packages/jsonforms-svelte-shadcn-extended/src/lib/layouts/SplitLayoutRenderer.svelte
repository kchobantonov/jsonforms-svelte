<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsLayout,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { useSplitLayout } from '@chobantonov/jsonforms-svelte-extended';
  import { Pane, SplitPane, useShadcnLayout } from '@chobantonov/jsonforms-svelte-shadcn';
  import type { Layout } from '@jsonforms/core';

  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
  const split = useSplitLayout(() => binding.layout);
</script>

{#if binding.layout.visible && split.value.items.length}
  <div
    use:split.measure
    data-split-layout={split.value.direction}
    data-layout-diagnostic={split.value.diagnostics
      .map((diagnostic) => diagnostic.code)
      .join(' ') || undefined}
    style:height={split.value.height}
    style:min-height={split.value.minHeight}
    class="min-h-0 min-w-0 overflow-auto"
  >
    {#key split.value.key}
      <SplitPane
        direction={split.value.direction}
        initialSizes={split.value.sizes}
        sizes={split.value.controlledSizes}
        minimumSizes={split.value.minimumSizes}
        maximumSizes={split.value.maximumSizes}
        onResize={split.resize}
        resizable={split.value.resizable}
        resizeLabel={split.value.resizeLabel}
        responsive={false}
        minSize={1}
        class="h-full w-full min-w-0"
      >
        {#each split.value.items as item (item.index)}
          <Pane class="min-h-0 min-w-0" style={item.crossStyle}>
            <div class="h-full min-h-0 min-w-0 overflow-auto" data-split-pane={item.index}>
              <DispatchRenderer
                schema={binding.layout.schema}
                uischema={item.element}
                path={binding.layout.path}
                enabled={binding.layout.enabled}
                renderers={binding.layout.renderers}
                cells={binding.layout.cells}
              />
            </div>
          </Pane>
        {/each}
      </SplitPane>
    {/key}
  </div>
{/if}
