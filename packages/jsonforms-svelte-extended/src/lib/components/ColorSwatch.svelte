<script lang="ts">
  import { toCssColor } from '../core/colorProfile';
  let { value }: { value: unknown } = $props();
  const color = $derived(toCssColor(value));
</script>

<span
  class="pointer-events-none relative block h-full w-full overflow-hidden rounded-sm border border-current/20"
  style:pointer-events="none"
  aria-hidden="true"
  data-color-empty-swatch={!color || undefined}
>
  <svg
    class="absolute inset-0 h-full w-full opacity-25"
    viewBox="0 0 32 24"
    preserveAspectRatio="none"
    shape-rendering="crispEdges"
    data-color-empty-pattern={!color || undefined}
  >
    <rect class="color-empty-base" fill="transparent" width="32" height="24" />
    <path
      class="color-empty-check"
      fill="currentColor"
      d="M0 0h8v8H0zM16 0h8v8h-8zM8 8h8v8H8zM24 8h8v8h-8zM0 16h8v8H0zM16 16h8v8h-8z"
    />
  </svg>
  {#if color}<span class="absolute inset-0" style:background={color}></span>{/if}
</span>
