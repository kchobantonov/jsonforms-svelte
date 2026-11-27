<script lang="ts">
  import {
    useJsonFormsLayout,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { SplitLayoutContent } from '@chobantonov/jsonforms-svelte-extended';
  import { Pane, SplitPane, useShadcnLayout } from '@chobantonov/jsonforms-svelte-shadcn';
  import type { Layout } from '@jsonforms/core';

  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
</script>

<SplitLayoutContent layout={binding.layout} {SplitPane} {Pane} />
