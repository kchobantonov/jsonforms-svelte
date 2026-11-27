<script lang="ts">
  import VisibilityToggle from './VisibilityToggle.svelte';
  import type { ComponentProps } from 'svelte';
  let {
    open,
    ...props
  }: Omit<ComponentProps<typeof VisibilityToggle>, 'active' | 'expanded'> & { open: boolean } =
    $props();
</script>

<VisibilityToggle {...props} active={open} expanded />
