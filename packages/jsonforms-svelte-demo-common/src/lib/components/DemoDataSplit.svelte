<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { rendererMessage } from '@chobantonov/jsonforms-svelte-renderer-common';
  const {
    SplitPane,
    Pane,
    locale,
    class: className,
    formPaneClass = 'pe-4',
    form,
    data,
  }: {
    SplitPane: Component<{
      initialSizes: number[];
      minSize: number;
      resizeLabel: string;
      class?: string;
      children: Snippet;
    }>;
    Pane: Component<{ class: string; children: Snippet }>;
    locale: string;
    class?: string;
    formPaneClass?: string;
    form: Snippet;
    data: Snippet;
  } = $props();
</script>

<SplitPane
  initialSizes={[75, 25]}
  minSize={200}
  resizeLabel={rendererMessage(locale, 'splitLayout.resize')}
  class={className}
>
  <Pane class={formPaneClass}
    ><div class="pointer-events-auto select-text">{@render form()}</div></Pane
  >
  <Pane class="ps-4"><div class="pointer-events-auto select-text">{@render data()}</div></Pane>
</SplitPane>
