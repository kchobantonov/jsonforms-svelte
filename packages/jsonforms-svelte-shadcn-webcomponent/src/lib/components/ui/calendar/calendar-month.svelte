<script lang="ts">
  import { type WithElementRef, cn } from '@jsonforms-svelte-shadcn-ui/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<div {...restProps} bind:this={ref} class={cn('flex w-full flex-col gap-4', className)}>
  {@render children?.()}
</div>
