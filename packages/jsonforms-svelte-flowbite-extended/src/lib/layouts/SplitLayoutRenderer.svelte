<script lang="ts">
  import {
    useJsonFormsLayout,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { SplitLayoutContent } from '@chobantonov/jsonforms-svelte-extended';
  import { Pane, SplitPane, useFlowbiteLayout } from '@chobantonov/jsonforms-svelte-flowbite';
  import type { Layout } from '@jsonforms/core';

  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
</script>

<SplitLayoutContent layout={binding.layout} {SplitPane} {Pane} />
