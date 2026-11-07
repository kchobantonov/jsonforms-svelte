<script lang="ts">
  import { Pane, SplitPane } from 'flowbite-svelte';
  import { flowbiteSplitHandles } from '../../src/lib/util/flowbiteSplitHandles';
  let {
    dir = 'rtl',
    direction = 'horizontal',
    resizable = true,
    label = 'Resize panes',
    nested = false,
    visible = true,
  }: {
    dir?: 'ltr' | 'rtl';
    direction?: 'horizontal' | 'vertical';
    resizable?: boolean;
    label?: string;
    nested?: boolean;
    visible?: boolean;
  } = $props();
</script>

<div {dir} style="width: 360px; height: 320px">
  {#if visible}
    <div data-testid="outer" class="h-full" use:flowbiteSplitHandles={{ resizable, label }}>
      <SplitPane {direction} responsive={false} transition={false} minSize={1}>
        <Pane
          ><input aria-label="First" value="Original" />
          {#if nested}
            <div data-testid="inner" class="h-40" use:flowbiteSplitHandles={{ resizable, label }}>
              <SplitPane responsive={false} transition={false} minSize={1}>
                <Pane><input aria-label="Inner first" /></Pane>
                <Pane><input aria-label="Inner second" /></Pane>
              </SplitPane>
            </div>
          {/if}
        </Pane>
        <Pane><input aria-label="Second" /></Pane>
      </SplitPane>
    </div>
  {/if}
</div>
