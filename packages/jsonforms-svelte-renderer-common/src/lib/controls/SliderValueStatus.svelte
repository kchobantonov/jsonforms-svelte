<script lang="ts">
  import type { useSliderControl } from './slider.svelte';
  const { id, slider }: { id: string; slider: ReturnType<typeof useSliderControl> } = $props();
</script>

<span {id} class={slider.state.missing || slider.state.invalid ? 'text-sm' : 'sr-only'}
  >{slider.valueText}</span
>
