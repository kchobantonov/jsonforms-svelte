<script lang="ts">
  import * as ResizablePrimitive from 'paneforge';
  import { cn } from '../utils.js';

  let {
    ref = $bindable(null),
    this: paneGroup = $bindable(),
    class: className,
    ...restProps
  }: ResizablePrimitive.PaneGroupProps & {
    this?: ResizablePrimitive.PaneGroup;
  } = $props();
  // Forward the native imperative API through the styled wrapper.
  export const getLayout = () => paneGroup?.getLayout();
  export const setLayout = (sizes: number[]) => paneGroup?.setLayout(sizes);
</script>

<ResizablePrimitive.PaneGroup
  bind:this={paneGroup}
  data-slot="resizable-pane-group"
  class={cn('flex h-full w-full data-[direction=vertical]:flex-col', className)}
  {...restProps}
/>
