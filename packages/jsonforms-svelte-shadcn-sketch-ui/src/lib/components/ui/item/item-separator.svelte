<script lang="ts">
  import { Separator } from '@jsonforms-svelte-shadcn-ui/separator/index.js';
  import { cn } from '@jsonforms-svelte-shadcn-ui/utils.js';
  import type { ComponentProps } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  bind:ref
  data-slot="item-separator"
  orientation="horizontal"
  class={cn('my-2', className)}
  {...restProps}
/>
