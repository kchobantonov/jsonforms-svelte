<script lang="ts">
  import * as Resizable from "@jsonforms-svelte-shadcn-ui/resizable/index.js";
  import { onMount, tick, untrack, type Snippet } from "svelte";
  let {
    visible,
    children,
    size = 40,
  }: { visible: boolean; children: Snippet; size?: number } = $props();
  let pane:
    | {
        collapse: () => void;
        resize: (size: number) => void;
        getSize: () => number;
      }
    | undefined = $state();
  let restoredSize = untrack(() => size);
  let ready = $state(false);
  onMount(() => {
    let alive = true;
    void tick().then(() => {
      if (alive) ready = true;
    });
    return () => {
      alive = false;
    };
  });
  $effect(() => {
    const open = visible;
    if (ready && pane)
      untrack(() => {
        if (open) pane?.resize(restoredSize);
        else {
          const current = pane?.getSize() ?? 0;
          if (current > 0) restoredSize = current;
          pane?.collapse();
        }
      });
  });
</script>

<Resizable.Pane
  bind:this={pane}
  defaultSize={visible ? size : 0}
  minSize={15}
  collapsible
  collapsedSize={0}
>
  <div class="workspace-panel" hidden={!visible}>{@render children()}</div>
</Resizable.Pane>
