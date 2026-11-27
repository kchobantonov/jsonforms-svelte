<script lang="ts">
  import SplitPane from '../../src/lib/components/SplitPane.svelte';
  import Pane from '../../src/lib/components/Pane.svelte';
  import ControlledPanes from '../../../jsonforms-svelte-renderer-common/tests/fixtures/ControlledPanes.svelte';
  let {
    direction = 'horizontal',
    dir = 'ltr',
    size = 80,
    onResize,
    responsive = false,
    breakpoint = 768,
    showSecond = true,
    resizable = true,
    minSize = 100,
    keyboardStep = 2,
  }: {
    direction?: 'horizontal' | 'vertical';
    dir?: 'ltr' | 'rtl';
    size?: number;
    responsive?: boolean;
    breakpoint?: number;
    showSecond?: boolean;
    resizable?: boolean;
    minSize?: number;
    keyboardStep?: number;
    onResize?: (sizes: number[]) => void;
  } = $props();
</script>

<ControlledPanes
  {Pane}
  {SplitPane}
  {direction}
  {dir}
  {size}
  {onResize}
  {responsive}
  {breakpoint}
  {showSecond}
  {resizable}
  {minSize}
  {keyboardStep}
  transition={false}
/>
