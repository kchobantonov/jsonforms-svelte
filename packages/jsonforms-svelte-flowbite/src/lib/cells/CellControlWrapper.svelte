<script lang="ts">
  import type { ControlWrapperProps } from '../util';
  const { visible, children }: ControlWrapperProps = $props();
</script>

{#if visible}{@render children()}{/if}
