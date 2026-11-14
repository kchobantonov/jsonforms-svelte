<script lang="ts">
  import SplitPane from '../../src/lib/components/SplitPane.svelte';
  import Pane from '../../src/lib/components/Pane.svelte';
  let {
    direction = 'horizontal',
    dir = 'ltr',
    size = 80,
    onResize,
    responsive = false,
    breakpoint = 768,
    showSecond = true,
    resizable = true,
  }: {
    direction?: 'horizontal' | 'vertical';
    dir?: 'ltr' | 'rtl';
    size?: number;
    responsive?: boolean;
    breakpoint?: number;
    showSecond?: boolean;
    resizable?: boolean;
    onResize?: (sizes: number[]) => void;
  } = $props();
</script>

<div {dir} style:width={`${size}px`} style:height={`${size}px`}>
  <SplitPane
    {direction}
    {responsive}
    {breakpoint}
    transition={false}
    minSize={100}
    {onResize}
    {resizable}
  >
    <Pane><input aria-label="First" value="Original" /></Pane>
    {#if showSecond}<Pane><input aria-label="Second" /></Pane>{/if}
  </SplitPane>
</div>
