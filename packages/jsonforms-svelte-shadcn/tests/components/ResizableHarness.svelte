<script lang="ts">
  import SplitPane from '../../src/lib/components/SplitPane.svelte';
  import Pane from '../../src/lib/components/Pane.svelte';

  let {
    sizes = [75, 25],
    breakpoint = 0,
    direction = 'horizontal',
    onResize = (_sizes: number[]) => {},
  }: {
    sizes?: number[];
    breakpoint?: number;
    direction?: 'horizontal' | 'vertical';
    onResize?: (sizes: number[]) => void;
  } = $props();
</script>

<div style="width: 800px; height: 400px;">
  <SplitPane initialSizes={sizes} {direction} {breakpoint} {onResize}>
    <Pane><input aria-label="First pane value" value="Keep this value" /></Pane>
    <Pane><input aria-label="Second pane value" /></Pane>
  </SplitPane>
</div>
