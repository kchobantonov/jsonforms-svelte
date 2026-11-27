<script lang="ts">
  import VisibilityToggle from '../../components/VisibilityToggle.svelte';
  import type { ComponentProps } from 'svelte';
  let {
    revealed,
    ...props
  }: Omit<ComponentProps<typeof VisibilityToggle>, 'active' | 'expanded'> & { revealed: boolean } =
    $props();
</script>

<VisibilityToggle {...props} active={revealed} />
